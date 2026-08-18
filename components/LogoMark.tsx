import Svg, { G, Path } from 'react-native-svg';

import {
  LOGO_GROUP_TRANSFORM,
  LOGO_PATHS,
  LOGO_VIEW_HEIGHT,
  LOGO_VIEW_WIDTH,
} from '../constants/logo';
import { colors } from '../constants/theme';

interface LogoMarkProps {
  size?: number;
  color?: string;
}

// `size` is the mark's width in px; height follows the 600x328 trace ratio.
// Recommended tiers: hero (>=200) for splash/empty states, mid (~80-140)
// for cards. Below ~80 the trace detail breaks down.
export function LogoMark({ size = 120, color = colors.ink }: LogoMarkProps) {
  const height = (size * LOGO_VIEW_HEIGHT) / LOGO_VIEW_WIDTH;
  return (
    <Svg
      width={size}
      height={height}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
    >
      <G transform={LOGO_GROUP_TRANSFORM} fill={color}>
        {LOGO_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}
