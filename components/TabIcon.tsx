import Svg, { Line, Path } from 'react-native-svg';
import { StyleSheet } from 'react-native';

type IconName = 'barbell' | 'list' | 'clock';

interface TabIconProps {
  name: IconName;
  size?: number;
  color: string;
}

// Minimal hand-rolled line icons. 24x24 viewBox scaled to `size`.
// Stroke-only, matches the flat styling of the rest of the app.
export function TabIcon({ name, size = 24, color }: TabIconProps) {
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (name) {
    case 'barbell':
      // Outer plates + end caps + horizontal bar.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={styles.icon}>
          <Path d="M5 9 V15" {...common} />
          <Path d="M3 11 V13" {...common} />
          <Path d="M19 9 V15" {...common} />
          <Path d="M21 11 V13" {...common} />
          <Line x1="5" y1="12" x2="19" y2="12" {...common} />
        </Svg>
      );
    case 'list':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={styles.icon}>
          <Line x1="4" y1="7" x2="20" y2="7" {...common} />
          <Line x1="4" y1="12" x2="20" y2="12" {...common} />
          <Line x1="4" y1="17" x2="20" y2="17" {...common} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={styles.icon}>
          <Path d="M12 4 a8 8 0 1 0 0.001 0" {...common} />
          <Line x1="12" y1="12" x2="12" y2="8" {...common} />
          <Line x1="12" y1="12" x2="15" y2="13" {...common} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  icon: { display: 'flex' },
});
