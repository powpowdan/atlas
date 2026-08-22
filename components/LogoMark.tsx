import Svg, { G, Path } from 'react-native-svg';

import {
  LOGO_GROUP_TRANSFORM,
  LOGO_PATHS,
  LOGO_VIEW_HEIGHT,
  LOGO_VIEW_WIDTH,
  LOGO_VIEW_X,
  LOGO_VIEW_Y,
} from '../constants/logo';
import { colors } from '../constants/theme';

interface LogoMarkProps {
  size?: number;
  color?: string;
}

// `size` is the mark's width in px; height follows the cropped trace ratio
// (~158x300, portrait). Recommended tiers: ~110 (start card, empty states),
// ~90 (session summary). Below ~60 the trace detail breaks down.
export function LogoMark({ size = 90, color = colors.ink }: LogoMarkProps) {
  const height = (size * LOGO_VIEW_HEIGHT) / LOGO_VIEW_WIDTH;
  return (
    <Svg
      width={size}
      height={height}
      viewBox={`${LOGO_VIEW_X} ${LOGO_VIEW_Y} ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
    >
      <G transform={LOGO_GROUP_TRANSFORM} fill={color}>
        {LOGO_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}
