import { AtSign, Globe, Mail, MessageCircle, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuccessModal } from '../../components/modals';
import { Button, Field, PressableScale, ScreenHeader } from '../../components/ui';
import { useStore } from '../../lib/store';
import { font, motion, radius, shadow, themedStyles, useColors } from '../../theme';

const CHANNELS = [
  {
    Icon: Mail,
    label: 'hello@akaani.app',
    hint: 'We answer within a working day',
    url: 'mailto:hello@akaani.app',
  },
  { Icon: Phone, label: '+234 800 000 0000', hint: 'Mon–Fri, 9am–5pm WAT', url: 'tel:+2348000000000' },
  {
    Icon: MessageCircle,
    label: 'WhatsApp support',
    hint: 'Quickest for account problems',
    url: 'https://wa.me/2348000000000',
  },
  { Icon: AtSign, label: '@akaani on Instagram', hint: 'Recipes and release notes', url: 'https://instagram.com/akaani' },
  { Icon: Globe, label: 'akaani.app', hint: 'Status and release notes', url: 'https://akaani.app' },
];

export default function ContactScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!subject.trim() || !message.trim()) return;
    setSubject('');
    setMessage('');
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Contact us" sub="A real person reads these" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        {CHANNELS.map((c, i) => (
          <Animated.View
            key={c.label}
            entering={FadeInDown.delay(i * 45)
              .duration(motion.base)
              .easing(motion.enter)}
          >
            <PressableScale
              onPress={() => Linking.openURL(c.url).catch(() => {})}
              style={styles.row}
              scaleTo={0.98}
            >
              <View style={styles.rowIcon}>
                <c.Icon size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{c.label}</Text>
                <Text style={styles.rowHint}>{c.hint}</Text>
              </View>
            </PressableScale>
          </Animated.View>
        ))}

        <Animated.View
          entering={FadeInDown.delay(240).duration(motion.base).easing(motion.enter)}
          style={styles.formCard}
        >
          <Text style={styles.formTitle}>Or write to us here</Text>
          <Text style={styles.formSub}>
            We&apos;ll reply to {user?.email ?? 'the email on your account'}.
          </Text>
          <Field
            label="Subject"
            placeholder="Billing, a bug, a missing dish…"
            value={subject}
            onChangeText={setSubject}
            style={{ marginTop: 16 }}
          />
          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            placeholder="Tell us what is going on…"
            placeholderTextColor={colors.inkFaint}
            value={message}
            onChangeText={setMessage}
            multiline
            style={styles.textArea}
          />
          <Button
            title="Send message"
            onPress={send}
            disabled={!subject.trim() || !message.trim()}
            style={{ marginTop: 16 }}
          />
        </Animated.View>
      </ScrollView>

      <SuccessModal
        visible={sent}
        title="Message sent"
        message="We've got it. Expect a reply within one working day."
        buttonLabel="Done"
        onClose={() => setSent(false)}
      />
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.card,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  rowHint: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 14,
    ...shadow.card,
  },
  formTitle: { fontFamily: font.bold, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  formSub: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  fieldLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft, marginTop: 16 },
  textArea: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: 14,
    marginTop: 6,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
}));
