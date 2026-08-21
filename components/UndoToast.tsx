import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '../constants/theme';
import { useUndoStore } from '../store/undo';

const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };
const HIDDEN_OFFSET = 200;

export function UndoToast() {
  const label = useUndoStore((s) => s.label);
  const restore = useUndoStore((s) => s.restore);
  const performUndo = useUndoStore((s) => s.performUndo);
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(label !== null ? 1 : 0, TIMING);
  }, [label, progress]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * HIDDEN_OFFSET }],
    opacity: progress.value,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: 12 + insets.bottom }]}
    >
      <Animated.View
        pointerEvents={label === null ? 'none' : 'auto'}
        style={[styles.bar, barStyle]}
      >
        {label !== null ? <Text style={styles.label}>{label}</Text> : null}
        {restore ? (
          <Pressable
            style={styles.undoBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              void performUndo();
            }}
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%',
    maxWidth: 480,
  },
  label: { ...type.body, flex: 1, color: colors.ink },
  undoBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  undoText: { ...type.action, color: colors.verdigris },
});
