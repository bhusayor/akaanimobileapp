import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { font, motion, radius, shadow, themedStyles, useColors } from '../theme';
import { Button } from './ui';

/** Dimmed backdrop + springy centered card. */
export function AppModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ width: '100%' }}>
          <Animated.View
            entering={ZoomIn.duration(motion.base).easing(motion.enter)}
            style={styles.card}
          >
            {children}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <AppModal visible={visible} onClose={onClose}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.row}>
        <Button title={cancelLabel} variant="ghost" onPress={onClose} style={{ flex: 1, height: 50 }} />
        <Button
          title={confirmLabel}
          onPress={() => {
            onConfirm();
            onClose();
          }}
          style={{ flex: 1, height: 50, ...(danger ? { backgroundColor: colors.danger } : {}) }}
        />
      </View>
    </AppModal>
  );
}

function Burst({ delay, angle }: { delay: number; angle: number }) {
  const colors = useColors();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = 0;
    v.value = withDelay(delay, withTiming(1, { duration: 600, easing: motion.ease }));
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - v.value,
    transform: [
      { translateX: Math.cos(angle) * v.value * 46 },
      { translateY: Math.sin(angle) * v.value * 46 },
      { scale: 1 - v.value * 0.4 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: angle % 2 > 1 ? colors.secondary : colors.success,
        },
        style,
      ]}
    />
  );
}

/** Success modal with a springing check and a little confetti burst. */
export function SuccessModal({
  visible,
  title,
  message,
  buttonLabel = 'Done',
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  buttonLabel?: string;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const pop = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      pop.value = 0;
      pop.value = withDelay(120, withTiming(1, { duration: motion.base, easing: motion.enter }));
    }
  }, [visible, pop]);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.successBadgeWrap}>
        {visible &&
          Array.from({ length: 8 }).map((_, i) => (
            <Burst key={i} delay={250} angle={(i / 8) * Math.PI * 2} />
          ))}
        <Animated.View style={[styles.successBadge, checkStyle]}>
          <Check size={30} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(160).duration(motion.base)}>
        <Text style={[styles.title, { textAlign: 'center' }]}>{title}</Text>
        {!!message && <Text style={[styles.message, { textAlign: 'center' }]}>{message}</Text>}
      </Animated.View>
      <Button title={buttonLabel} onPress={onClose} style={{ marginTop: 4 }} />
    </AppModal>
  );
}

const useStyles = themedStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 10, 10, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg + 4,
    padding: 24,
    gap: 10,
    ...shadow.float,
  },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  message: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, color: colors.inkSoft },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  successBadgeWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 10 },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
