import type { TextStyle } from 'react-native';

export const colors = {
  paper: '#F7F3EA',
  paperDeep: '#EDE7D8',
  paperWell: '#F3EFE3',
  ink: '#2E2A24',
  inkSoft: '#57534A',
  inkFaint: '#3F3B31',
  textTertiary: '#8E887B',
  textDisabled: '#A9A294',
  border: '#E0D8C3',
  borderSubtle: '#EAE3D1',
  borderStrong: '#C7BFA9',
  brass: '#A8822C',
  brassTint: '#F2E8CE',
  brassBorder: '#DFCE9C',
  brassText: '#7E611B',
  verdigris: '#44684F',
  oxblood: '#7A2E2E',
  overlay: 'rgba(46,42,36,0.55)',
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: fonts.display } as TextStyle,
  wordmark: {
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 3,
  } as TextStyle,
  tabular: { fontVariant: ['tabular-nums'] } as TextStyle,
};
