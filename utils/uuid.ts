// Local RFC 4122 v4 UUID generator.
//
// Uses the platform CSPRNG (crypto.getRandomValues) when available — e.g. on
// web, where it is native. On React Native (Hermes) that API is not always
// present, so we fall back to Math.random. The values are local-only database
// primary keys; collision probability is negligible for a single-user dataset.
export function uuid(): string {
  const g: any = (globalThis as any);
  if (g?.crypto?.getRandomValues) {
    const bytes = g.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
