import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuccessModal } from '../../components/modals';
import { Button, Field, PressableScale, ScreenHeader } from '../../components/ui';
import { useStore } from '../../lib/store';
import { font, motion, radius, themedStyles, useColors } from '../../theme';

/** Edit the display name and profile picture. */
export default function EditProfileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  const initials = (name || 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const pick = async (source: 'library' | 'camera') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Allow camera access to take a profile picture.'
          : 'Allow photo access to choose a profile picture.'
      );
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const save = () => {
    if (name.trim().length < 2) {
      setError('Tell us what to call you');
      return;
    }
    updateProfile({ name: name.trim(), email: email.trim(), avatar });
    setSaved(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Edit profile" sub="Name and picture" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40, gap: 22 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.duration(motion.base).easing(motion.enter)}
          style={styles.avatarBlock}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" transition={250} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarActions}>
            <PressableScale onPress={() => pick('library')} style={styles.avatarBtn} scaleTo={0.95}>
              <ImageIcon size={16} color={colors.primary} strokeWidth={2.3} />
              <Text style={styles.avatarBtnText}>Choose photo</Text>
            </PressableScale>
            <PressableScale onPress={() => pick('camera')} style={styles.avatarBtn} scaleTo={0.95}>
              <Camera size={16} color={colors.primary} strokeWidth={2.3} />
              <Text style={styles.avatarBtnText}>Take photo</Text>
            </PressableScale>
            {!!avatar && (
              <PressableScale onPress={() => setAvatar(null)} style={styles.avatarBtn} scaleTo={0.95}>
                <Trash2 size={16} color={colors.danger} strokeWidth={2.3} />
                <Text style={[styles.avatarBtnText, { color: colors.danger }]}>Remove</Text>
              </PressableScale>
            )}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(70).duration(motion.base).easing(motion.enter)}
          style={{ gap: 18 }}
        >
          <Field
            label="Full name"
            placeholder="Adaeze Okafor"
            autoCapitalize="words"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(undefined);
            }}
            error={error}
          />
          <Field
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Save changes" onPress={save} style={{ marginTop: 4 }} />
        </Animated.View>
      </ScrollView>

      <SuccessModal
        visible={saved}
        title="Profile updated"
        message="Your name and picture have been saved on this device."
        buttonLabel="Done"
        onClose={() => {
          setSaved(false);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  avatarBlock: { alignItems: 'center', gap: 16, paddingTop: 8 },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.bgSoft },
  avatarText: { fontFamily: font.bold, fontSize: 34, color: colors.onPrimary },
  avatarActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  avatarBtnText: { fontFamily: font.semibold, fontSize: 13, color: colors.primary },
}));
