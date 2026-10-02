import React from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from './ui';
import { font, themedStyles, useColors } from '../theme';

export function SetupPage({ step, title, description, children, action, onContinue, onSkip, disabled = false }: {
  step: number; title: string; description: string; children: React.ReactNode;
  action: string; onContinue: () => void; onSkip?: () => void; disabled?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M19 12H5m6-6-6 6 6 6" stroke={colors.ink} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
        <View style={styles.progress}>{Array.from({ length: 8 }, (_, i) => <View key={i} style={[styles.bit, i < step && { backgroundColor: colors.secondary }]} />)}</View>
        {onSkip ? <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}><Text style={styles.skipText}>Skip</Text></Pressable>
          : <Text style={styles.step}>{String(step).padStart(2, '0')} / 08</Text>}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}><Button title={action} onPress={onContinue} disabled={disabled} /></View>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles(colors => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  nav: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  bit: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line },
  skip: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  step: { fontFamily: font.semibold, fontSize: 11, color: colors.inkSoft },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
  title: { fontFamily: font.extrabold, fontSize: 34, lineHeight: 39, letterSpacing: -1.1, color: colors.ink },
  description: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.inkSoft, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
}));
