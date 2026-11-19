/**
 * Aviso de «la sesión terminó» que se da UNA sola vez.
 *
 * Una pantalla suele pedir varias cosas a la vez; si la sesión venció, todas
 * reciben 401. Sin esto, cada una llevaría de nuevo a «Iniciar sesión».
 * Se vuelve a armar al iniciar sesión otra vez (`reset`).
 */
export function createSessionExpiry(onExpired: () => void) {
  let notified = false;
  return {
    /** La sesión terminó: avisa solo la primera vez. */
    notify() {
      if (notified) return;
      notified = true;
      onExpired();
    },
    /** Hay una sesión nueva: el próximo 401 vuelve a avisar. */
    reset() {
      notified = false;
    },
  };
}
