/**
 * Colores y medidas compartidas. Usarlos siempre desde aquí mantiene la
 * interfaz consistente (requisito de accesibilidad de GameUP).
 * La paleta es provisional hasta que el equipo defina la definitiva.
 */
export const colors = {
  background: '#FFF8EC',
  surface: '#FFFFFF',
  primary: '#2F6FDB',
  onPrimary: '#FFFFFF',
  text: '#1F2933',
  textMuted: '#52606D',
  success: '#2E7D32',
  warning: '#B26A00',
};

export const spacing = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  body: 20,
  title: 34,
  button: 24,
};

/** Alto mínimo de los botones: grandes y fáciles de tocar. */
export const touchTarget = 72;
