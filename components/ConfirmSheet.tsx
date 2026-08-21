import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '../constants/theme';
import { useConfirmStore, type ConfirmOptions } from '../store/confirm';

const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MESSAGE_MAX_HEIGHT = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ConfirmSheet() {
  const request = useConfirmStore((s) => s.request);
  const submit = useConfirmStore((s) => s.submit);
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState<ConfirmOptions | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (request) {
      setRendered(request);
      progress.value = 0;
      progress.value = withTiming(1, TIMING);
    }
  }, [request, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SCREEN_HEIGHT }],
  }));

  const current = request ?? rendered;
  if (!current) return null;

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="fade"
      onRequestClose={() => submit(false)}
    >
      <Pressable style={styles.scrim} onPress={() => submit(false)}>
        <AnimatedPressable
          style={[styles.sheet, sheetStyle, { paddingBottom: 12 + insets.bottom }]}
          onPress={() => {}}
        >
          <Text style={styles.title}>{current.title}</Text>
          {current.message || current.detail ? (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContent}
            >
              {current.message ? (
                <Text style={styles.message}>{current.message}</Text>
              ) : null}
              {current.detail ? (
                <Text style={styles.detail}>{current.detail}</Text>
              ) : null}
            </ScrollView>
          ) : null}
          <Pressable style={styles.actionRow} onPress={() => submit(true)}>
            <Text style={styles.confirmText}>{current.confirmLabel}</Text>
          </Pressable>
          <Pressable style={styles.actionRow} onPress={() => submit(false)}>
            <Text style={styles.cancelText}>
              {current.cancelLabel ?? 'Cancel'}
            </Text>
          </Pressable>
        </AnimatedPressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 16,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    ...type.modalTitle,
    color: colors.ink,
    marginBottom: 4,
  },
  messageScroll: { flexGrow: 0 },
  messageContent: { paddingBottom: 4 },
  message: {
    ...type.body,
    color: colors.inkSoft,
  },
  detail: {
    ...type.caption,
    color: colors.textTertiary,
    marginTop: 8,
  },
  actionRow: {
    paddingVertical: 13,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 4,
  },
  confirmText: { ...type.action, color: colors.oxblood },
  cancelText: { ...type.action, color: colors.inkSoft },
});
