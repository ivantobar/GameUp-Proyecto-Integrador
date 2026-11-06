/**
 * Tiempos de espera de las peticiones al backend.
 *
 * El backend en Render (plan gratuito) se duerme y tarda en despertar, por
 * eso la espera no es muy corta.
 */
export const REQUEST_TIMEOUT_MS = 15000;

/** Para subir un archivo (por ejemplo, la voz de «Habla conmigo», hasta 10 MB). */
export const UPLOAD_TIMEOUT_MS = 60000;
