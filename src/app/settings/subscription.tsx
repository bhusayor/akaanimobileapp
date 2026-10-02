import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, PressableScale, ScreenHeader } from '../../components/ui';
import { useBilling } from '../../lib/billing';
import { FREE_FEATURES, PREMIUM_FEATURES, useEntitlement } from '../../lib/subscription';
import { font, themedStyles, useColors } from '../../theme';

export default function SubscriptionScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { premium, status, daysLeft } = useEntitlement();
  const { available, restore } = useBilling();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const manageUrl = Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      setMessage((await restore()) ? 'Your Premium purchase is restored.' : 'No active purchase was found for this store account.');
    } catch {
      setMessage('Could not restore purchases. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <View style={styles.screen}>
    <ScreenHeader title="Subscription" sub="Your Akaani access" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
      <View style={styles.statusCard}>
        <Text style={styles.overline}>{premium ? 'AKAANI PREMIUM' : 'FREE PLAN'}</Text>
        <Text style={styles.statusTitle}>{status === 'trial' ? `Trial · ${daysLeft} days left` : premium ? 'Everything is unlocked' : 'Make more of every meal'}</Text>
        <Text style={styles.statusBody}>{premium ? 'Your access is managed by your app store.' : 'Upgrade to see every number and plan your week with more tools.'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Premium includes</Text>
      <View style={styles.featureList}>
        {PREMIUM_FEATURES.map(feature => <View key={feature.title} style={styles.feature}>
          <View style={styles.mark} /><View style={{ flex: 1 }}><Text style={styles.featureTitle}>{feature.title}</Text><Text style={styles.featureBody}>{feature.body}</Text></View>
        </View>)}
      </View>

      {!premium && <><Text style={styles.sectionTitle}>Free, always</Text>
        <Text style={styles.freeList}>{FREE_FEATURES.map(feature => feature.title).join(' · ')}</Text></>}

      <Button title={premium ? 'Manage in app store' : 'Explore Premium'} onPress={() => premium
        ? Linking.openURL(manageUrl).catch(() => setMessage('Could not open store settings.'))
        : router.push('/paywall')} />
      <PressableScale onPress={onRestore} disabled={!available || busy} style={styles.restore}>
        <Text style={[styles.restoreText, !available && { opacity: 0.5 }]}>{busy ? 'Restoring…' : 'Restore purchases'}</Text>
      </PressableScale>
      {message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
      {!available && <Text style={styles.note}>Purchases are available in the iOS and Android app.</Text>}
    </ScrollView>
  </View>;
}

const useStyles = themedStyles(colors => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 14 },
  statusCard: { borderRadius: 22, backgroundColor: colors.card, padding: 22, borderWidth: 1, borderColor: colors.line },
  overline: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.5, color: colors.secondary },
  statusTitle: { fontFamily: font.extrabold, fontSize: 26, lineHeight: 30, color: colors.ink, marginTop: 11 },
  statusBody: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft, marginTop: 7 },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.ink, marginTop: 8 },
  featureList: { borderRadius: 18, backgroundColor: colors.card, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  mark: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary, marginTop: 7 },
  featureTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  featureBody: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 16, color: colors.inkSoft, marginTop: 2 },
  freeList: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  restore: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  restoreText: { fontFamily: font.semibold, fontSize: 12, color: colors.secondary },
  message: { fontFamily: font.medium, fontSize: 12, color: colors.danger, textAlign: 'center' },
  note: { fontFamily: font.regular, fontSize: 11, color: colors.inkFaint, textAlign: 'center' },
}));
