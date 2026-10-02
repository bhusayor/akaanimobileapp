import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PressableScale } from '../components/ui';
import { useBilling } from '../lib/billing';
import { useEntitlement, type BillingCycle } from '../lib/subscription';
import { font } from '../theme';

const MONTHLY_USD = 6.99;
const YEARLY_USD = 49.99;

const BENEFITS = [
  { title: 'Full macro data', description: 'Calories, protein, carbs, fats and fibre.', path: 'M4 20h16M6 16v-5m6 5V4m6 12V8' },
  { title: 'Lu — take full control', description: 'Swap meals. Build a plan that feels like you.', path: 'M7 5h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4 3v-4a3 3 0 0 1-1-2V8a3 3 0 0 1 3-3ZM12 2v3m-4 5v2m8-2v2m-7 3q3 2 6 0' },
  { title: 'Plan and shop ahead', description: 'Next week’s meals. Your grocery list, sorted.', path: 'M5 5h14v16H5ZM8 3v4m8-4v4M5 10h14m-10 5 2 2 4-4' },
  { title: 'Cooking walkthrough', description: 'Every recipe, step by step with photos.', path: 'M3 5h18v15H3ZM3 9h18M6 17l4-5 3 3 2-2 3 4M7 5V3m10 2V3' },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const usableHeight = height - insets.top - insets.bottom;
  const compact = usableHeight < 780;
  const tiny = usableHeight < 720;
  const micro = usableHeight < 550;
  const { premium } = useEntitlement();
  const { available, loading, error, offering, getPackage, purchase, restore } = useBilling();
  const [cycle, setCycle] = useState<BillingCycle>('yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected = getPackage(cycle);
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  const savings = offering?.annual && offering.monthly
    ? Math.round((1 - offering.annual.product.price / (12 * offering.monthly.product.price)) * 100)
    : Math.round((1 - YEARLY_USD / (12 * MONTHLY_USD)) * 100);
  const unavailableMessage = Platform.OS === 'web'
    ? 'Open Akaani on iOS or Android to see prices and subscribe.'
    : !available ? 'Store billing is not connected in this build yet.'
      : error ?? 'Plans could not load. Please reopen this page and try again.';

  useEffect(() => {
    if (offering && !offering.annual && offering.monthly) setCycle('monthly');
  }, [offering]);

  const buy = async () => {
    if (premium) return router.back();
    if (busy || loading) return;
    if (!selected) return setMessage(unavailableMessage);
    setBusy(true);
    setMessage(null);
    try {
      const result = await purchase(cycle);
      if (result === 'active') router.back();
      else if (result === 'pending') setMessage('Your purchase is processing. Access updates after store confirmation.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Purchase could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const onRestore = async () => {
    if (busy) return;
    if (!available) return setMessage(unavailableMessage);
    setBusy(true);
    setMessage(null);
    try {
      if (await restore()) router.back();
      else setMessage('No active purchase was found for this store account.');
    } catch {
      setMessage('Could not restore purchases. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <View style={styles.screen}>
    <StatusBar style="light" />
    <Image source={require('../../assets/images/paywall-food.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top right" cachePolicy="memory-disk" priority="high" accessible={false} />
    <LinearGradient pointerEvents="none" colors={['rgba(7,25,23,0.35)', 'rgba(7,25,23,0.5)', 'rgba(7,25,23,0.62)']} style={StyleSheet.absoluteFill} />
    <View style={[styles.layout, { maxWidth: width > height ? 700 : 480, paddingTop: insets.top + (tiny ? 4 : 10), paddingBottom: insets.bottom + (tiny ? 8 : 18), paddingHorizontal: tiny ? 14 : 20, gap: micro ? 8 : tiny ? 10 : 16 }]}>
      <View style={[styles.hero, { minHeight: micro ? 94 : tiny ? 112 : 155 }]}>
        <View style={styles.topRow}>
          <PressableScale onPress={onRestore} accessibilityLabel="Restore purchases" disabled={busy} haptic={false} style={styles.topRestore}><Text style={styles.topRestoreText}>{micro ? 'Restore' : 'Restore purchases'}</Text></PressableScale>
          {micro && <View style={styles.brand}><Image source={require('../../assets/images/splash-icon.png')} style={{ width: 19, height: 23 }} contentFit="contain" /><Text style={[styles.brandText, { fontSize: 23 }]}>akaani.</Text></View>}
          <PressableScale onPress={() => router.back()} accessibilityLabel="Close paywall" style={styles.close}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="m6 6 12 12M18 6 6 18" stroke="#003C3A" strokeWidth={1.8} strokeLinecap="round" /></Svg>
          </PressableScale>
        </View>
        <View style={[styles.headline, { gap: tiny ? 4 : 8, paddingBottom: tiny ? 0 : 6 }]}>
          {!micro && <View style={styles.brand}>
            <Image source={require('../../assets/images/splash-icon.png')} style={[styles.logo, tiny && { width: 21, height: 23 }]} contentFit="contain" />
            <Text style={[styles.brandText, { fontSize: tiny ? 24 : 31 }]}>akaani<Text style={styles.brandDot}>.</Text></Text>
            <View style={styles.proBadge}><Text style={styles.premium}>PRO</Text></View>
          </View>}
          <Text style={[styles.title, { fontSize: tiny ? 23 : 31, lineHeight: tiny ? 26 : 35 }]} numberOfLines={2} adjustsFontSizeToFit>Eat better. Live healthier.</Text>
          <Text style={[styles.description, { fontSize: tiny ? 11.5 : 14 }]} numberOfLines={1}>Upgrade to Akaani Pro today.</Text>
        </View>
      </View>

      <View style={[styles.benefitsCard, { padding: micro ? 12 : tiny ? 13 : 22, gap: micro ? 6 : tiny ? 9 : compact ? 17 : 24 }]}>
          {BENEFITS.map(benefit => <View key={benefit.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Svg width={tiny ? 21 : 25} height={tiny ? 21 : 25} viewBox="0 0 24 24"><Path d={benefit.path} stroke="#00403D" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
            </View>
            <View style={[styles.benefitCopy, micro && { gap: 1 }]}>
              <Text style={[styles.benefitTitle, { fontSize: micro ? 12 : tiny ? 13 : 16, lineHeight: micro ? 15 : tiny ? 16 : 21 }]} numberOfLines={1}>{benefit.title}</Text>
              <Text style={[styles.benefitDescription, { fontSize: tiny ? 10 : 12, lineHeight: micro ? 12 : tiny ? 13 : 17 }]} numberOfLines={1} adjustsFontSizeToFit>{benefit.description}</Text>
            </View>
          </View>)}
      </View>

      <View style={[styles.paymentCard, { padding: micro ? 12 : tiny ? 14 : 19, gap: micro ? 8 : tiny ? 10 : 15 }]}>
          {!micro && <View style={styles.decisionHeader}>
            <Text style={styles.choose}>CHOOSE YOUR PLAN</Text>
            <Text style={styles.store}>{selected ? 'Full access, either way' : loading ? 'Loading prices…' : 'Mobile app subscription'}</Text>
          </View>}
          <View style={styles.plans}>
            {(['yearly', 'monthly'] as BillingCycle[]).map(id => {
              const item = getPackage(id);
              const active = cycle === id;
              const missingStorePlan = available && !!offering && !item;
              const displayPrice = item
                ? id === 'yearly'
                  ? item.product.pricePerMonthString ?? new Intl.NumberFormat(undefined, { style: 'currency', currency: item.product.currencyCode }).format(item.product.price / 12)
                  : item.product.priceString
                : id === 'yearly' ? '$4.17' : '$6.99';
              const billedPrice = id === 'yearly' ? item?.product.priceString ?? '$49.99' : item?.product.priceString ?? '$6.99';
              return <PressableScale key={id} onPress={() => { setCycle(id); setMessage(null); }} disabled={busy || premium || missingStorePlan}
                accessibilityLabel={`${id === 'yearly' ? 'Yearly' : 'Monthly'} plan${active ? ', selected' : ''}, ${displayPrice} per month${id === 'yearly' ? `, billed ${billedPrice} yearly` : ''}`}
                style={[styles.plan, { paddingVertical: micro ? 8 : tiny ? 10 : 14 }, active && styles.planActive, missingStorePlan && { opacity: 0.5 }]}>
                {id === 'yearly' && savings > 0 && <View style={styles.savePill}><Text style={styles.saveText}>SAVE {savings}%</Text></View>}
                <View style={styles.planTop}>
                  <Text style={[styles.planName, tiny && { fontSize: 12 }]}>{id === 'yearly' ? 'Annual Pro' : 'Monthly Pro'}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>{active && <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="m5 12 4 4 10-10" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>}</View>
                </View>
                <View style={styles.priceRow}><Text style={[styles.planPrice, { fontSize: tiny ? 19 : 23 }]} numberOfLines={1} adjustsFontSizeToFit>{displayPrice}</Text><Text style={styles.priceUnit}>/mo</Text></View>
                <Text style={styles.planPeriod}>{id === 'yearly' ? `Billed ${billedPrice}/year` : 'Billed monthly'}</Text>
              </PressableScale>;
            })}
          </View>
        <View style={[styles.bottom, micro && { gap: 5 }]}>
          <PressableScale onPress={buy} disabled={busy || loading} accessibilityLabel={premium ? 'Close paywall' : 'Get Akaani Pro'} style={[styles.cta, { minHeight: tiny ? 46 : 54 }, (busy || loading) && { opacity: 0.7 }]}>
            {busy || loading ? <ActivityIndicator color="#FFFFFF" /> : <>
              <Text style={styles.ctaText}>{premium ? 'You have Akaani Pro' : 'Get Akaani Pro'}</Text>
            </>}
          </PressableScale>
          <Text style={styles.cancel}>Cancel anytime</Text>
          <Text accessibilityRole={message ? 'alert' : undefined} style={[styles.legal, message && styles.message]} numberOfLines={2}>{message ?? (selected
            ? `${selected.product.priceString}/${cycle === 'yearly' ? 'year' : 'month'}. Auto-renews until cancelled in ${storeName}.`
            : Platform.OS === 'web' ? 'USD prices shown. Subscribe in the mobile app.' : 'USD prices shown. Final price appears in the store.')}</Text>
        </View>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#102620', alignItems: 'center' },
  layout: { width: '100%', flex: 1 },
  hero: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topRestore: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 },
  topRestoreText: { fontFamily: font.medium, fontSize: 11, color: '#FFFFFF' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  logo: { width: 26, height: 29 },
  brandText: { fontFamily: font.extrabold, fontSize: 22, color: '#FFFFFF', letterSpacing: -0.9 },
  brandDot: { color: '#F9B17D' },
  proBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, marginLeft: 4, backgroundColor: '#D9ECE7' },
  premium: { fontFamily: font.bold, fontSize: 8, color: '#003C3A', letterSpacing: 1.1 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEEEA', alignItems: 'center', justifyContent: 'center' },
  headline: { alignItems: 'center' },
  title: { fontFamily: font.bold, color: '#FFFFFF', letterSpacing: -0.9, textAlign: 'center' },
  description: { fontFamily: font.regular, lineHeight: 18, color: '#F3F3EF', textAlign: 'center' },
  benefitsCard: { backgroundColor: '#FFFDFC', borderRadius: 25 },
  paymentCard: { backgroundColor: '#FFFDFC', borderRadius: 25 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 27, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1, gap: 3 },
  benefitTitle: { fontFamily: font.semibold, color: '#2B2035' },
  benefitDescription: { fontFamily: font.regular, color: '#807387' },
  decisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  choose: { fontFamily: font.bold, fontSize: 8, color: '#526057', letterSpacing: 1.05 },
  store: { fontFamily: font.regular, fontSize: 9, color: '#72796E' },
  plans: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1.5, borderColor: '#E0E4E1', backgroundColor: '#F5F6F3', gap: 4 },
  planActive: { borderColor: '#003C3A', backgroundColor: '#D9ECE7' },
  savePill: { position: 'absolute', top: -10, left: 10, zIndex: 2, backgroundColor: '#003C3A', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  saveText: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.3, color: '#FFFFFF' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontFamily: font.semibold, fontSize: 14, color: '#2B2035' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: '#9AAFAA', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#003C3A', backgroundColor: '#003C3A' },
  planPrice: { fontFamily: font.semibold, color: '#2B2035', letterSpacing: -0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceUnit: { fontFamily: font.medium, fontSize: 11, color: '#2B2035' },
  planPeriod: { fontFamily: font.regular, fontSize: 10, color: '#807387' },
  bottom: { gap: 8, alignItems: 'center' },
  cta: { width: '100%', borderRadius: 13, backgroundColor: '#003C3A', justifyContent: 'center', alignItems: 'center' },
  ctaText: { fontFamily: font.bold, fontSize: 17, color: '#FFFFFF' },
  cancel: { fontFamily: font.medium, fontSize: 12, color: '#003C3A' },
  legal: { minHeight: 24, fontFamily: font.regular, fontSize: 10, lineHeight: 12, color: '#807387', textAlign: 'center' },
  message: { color: '#924C2F' },
});
