import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, type } from '../constants/theme';

const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };

interface AnimatedCategorySectionProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  onHeaderLayout?: (y: number) => void;
  children: ReactNode;
}

export function AnimatedCategorySection({
  title,
  count,
  expanded,
  onToggle,
  onLongPress,
  showMenu,
  onMenu,
  onHeaderLayout,
  children,
}: AnimatedCategorySectionProps) {
  const height = useSharedValue(0);
  const rotation = useSharedValue(0);
  const contentHeight = useRef(0);

  useEffect(() => {
    height.value = withTiming(expanded ? contentHeight.current : 0, TIMING);
    rotation.value = withTiming(expanded ? 90 : 0, TIMING);
  }, [expanded, height, rotation]);

  function handleContentLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.height;
    contentHeight.current = next;
    if (expanded) {
      height.value = withTiming(next, TIMING);
    }
  }

  const bodyStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View>
      <Pressable
        style={styles.header}
        onPress={onToggle}
        onLongPress={onLongPress}
        onLayout={(event) =>
          onHeaderLayout?.(event.nativeEvent.layout.y)
        }
      >
        <Animated.View style={[styles.chevronWrap, chevronStyle]}>
          <Text style={styles.chevron}>▸</Text>
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{count}</Text>
        {showMenu ? (
          <Pressable style={styles.menuBtn} hitSlop={8} onPress={onMenu}>
            <Text style={styles.menu}>⋯</Text>
          </Pressable>
        ) : null}
      </Pressable>
      <Animated.View style={[styles.body, bodyStyle]}>
        <View
          onLayout={handleContentLayout}
          style={styles.bodyContent}
          collapsable={false}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.paperDeep,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  chevron: { ...type.caption, lineHeight: 12, color: colors.inkSoft },
  title: {
    ...type.sectionHeader,
    color: colors.inkSoft,
    flex: 1,
  },
  count: { ...type.caption, color: colors.textTertiary },
  menuBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  menu: { ...type.body, color: colors.inkSoft },
  body: { overflow: 'hidden' },
  // Absolutely positioned so the content measures its natural height even
  // while the animated wrapper is collapsed to 0 — Android/Yoga would
  // otherwise lay the child out at 0 (or drop it from the native hierarchy,
  // silenced by collapsable={false}). The wrapper clips it like a window.
  bodyContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
