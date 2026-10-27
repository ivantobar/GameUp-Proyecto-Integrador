/** «Martín C.» → «Martín». Para textos cercanos («Martín · intento 2»). */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}
