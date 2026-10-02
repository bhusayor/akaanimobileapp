import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AppModal, SuccessModal } from '../components/modals';
import { Button } from '../components/ui';
import { font, radius, themedStyles, useColors } from '../theme';
import { useStore } from './store';

/** g-force above resting gravity that counts as a deliberate shake. */
const THRESHOLD = 1.7;
/** Ignore further shakes for this long so one wobble is one report. */
const COOLDOWN_MS = 2500;

type ShakeApi = { openFeedback: () => void };

const Ctx = createContext<ShakeApi | null>(null);

/**
 * Listens to the accelerometer while `settings.shakeToFeedback` is on and opens
 * the feedback sheet when the phone is shaken. Also exposes `openFeedback()` so
 * the Help screen can open the same sheet from a button.
 */
export function ShakeFeedbackProvider({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const colors = useColors();
  const { settings, user } = useStore();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [text, setText] = useState('');
  const lastShake = useRef(0);

  const openFeedback = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!settings.shakeToFeedback) return;
    let sub: { remove: () => void } | undefined;
    let cancelled = false;

    // Desktop browsers (and simulators) have no accelerometer — degrade quietly
    // rather than taking the whole app down with an unhandled sensor error.
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(120);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const force = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (force > THRESHOLD && now - lastShake.current > COOLDOWN_MS) {
            lastShake.current = now;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            setOpen(true);
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [settings.shakeToFeedback]);

  const submit = () => {
    setOpen(false);
    setText('');
    setSent(true);
  };

  return (
    <Ctx.Provider value={{ openFeedback }}>
      {children}

      <AppModal visible={open} onClose={() => setOpen(false)}>
        <Text style={styles.title}>Something feel off?</Text>
        <Text style={styles.message}>
          You shook the phone — tell us what happened and it goes straight to the team
          {user?.email ? ` from ${user.email}` : ''}.
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="The macros on this meal look wrong…"
          placeholderTextColor={colors.inkFaint}
          multiline
          style={styles.input}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Button
            title="Not now"
            variant="ghost"
            onPress={() => setOpen(false)}
            style={{ flex: 1, height: 50 }}
          />
          <Button
            title="Send"
            onPress={submit}
            disabled={!text.trim()}
            style={{ flex: 1, height: 50 }}
          />
        </View>
      </AppModal>

      <SuccessModal
        visible={sent}
        title="Feedback sent"
        message="Thank you — every report makes the next version sharper."
        buttonLabel="Done"
        onClose={() => setSent(false)}
      />
    </Ctx.Provider>
  );
}

/** Opens the same feedback sheet the shake gesture opens. */
export function useShakeFeedback(): ShakeApi {
  return useContext(Ctx) ?? { openFeedback: () => {} };
}

const useStyles = themedStyles((colors) => ({
  title: { fontFamily: font.bold, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  message: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  input: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    padding: 14,
    fontFamily: font.regular,
    fontSize: 14.5,
    color: colors.ink,
    textAlignVertical: 'top',
    marginTop: 6,
  },
}));
