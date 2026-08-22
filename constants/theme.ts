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
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 23,
    textTransform: 'uppercase',
    letterSpacing: 3,
  } as TextStyle,
  title: { fontFamily: fonts.display, fontSize: 20 },
  heroStat: {
    fontSize: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  heading: { fontSize: 17, fontWeight: '600' } as TextStyle,
  modalTitle: { fontSize: 16, fontWeight: '600' } as TextStyle,
  cta: { fontSize: 16, fontWeight: '600' } as TextStyle,
  stat: {
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  body: { fontSize: 14, lineHeight: 20 } as TextStyle,
  action: { fontSize: 14, fontWeight: '600' } as TextStyle,
  meta: { fontSize: 13 } as TextStyle,
  sectionHeader: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 } as TextStyle,
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as TextStyle,
  caption: { fontSize: 12, lineHeight: 16 } as TextStyle,
  micro: { fontSize: 10, fontWeight: '600' } as TextStyle,
  tabular: { fontVariant: ['tabular-nums'] } as TextStyle,
};
