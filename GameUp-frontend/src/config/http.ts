/**
 * Tiempos de espera de las peticiones al backend.
 *
 * El backend en Render (plan gratuito) se duerme y tarda en despertar, por
 * eso la espera no es muy corta.
 */
export const REQUEST_TIMEOUT_MS = 15000;

/** Para subir un archivo (por ejemplo, la voz de «Habla conmigo», hasta 10 MB). */
export const UPLOAD_TIMEOUT_MS = 60000;

/**
 * Para iniciar sesión y para despertar el backend al abrir «Iniciar sesión»:
 * en el plan gratuito de Render, el primer pedido del día puede tardar casi
 * un minuto.
 */
export const LOGIN_TIMEOUT_MS = 60000;

/**
 * Si «Entrar» tarda más que esto, se avisa «Estamos despertando GameUP…»
 * (para que nadie piense que falla su internet).
 */
export const WAKE_HINT_MS = 5000;
