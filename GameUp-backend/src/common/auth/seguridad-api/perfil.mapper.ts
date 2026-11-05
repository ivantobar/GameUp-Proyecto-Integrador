import type { IdentidadExterna } from '../verificador-token.js';

/**
 * Convierte la respuesta de GET /api/auth/perfil (API de seguridad) en una
 * IdentidadExterna.
 *
 * PROVISIONAL: la colección del otro grupo aún no trae un ejemplo de
 * respuesta, así que se aceptan los nombres de campo más probables. Cuando
 * llegue el ejemplo real, se ajustan SOLO las listas de abajo (y su prueba).
 *
 * Roles: un usuario puede tener varios (tabla rol_usuario). Se recogen todos
 * los `nombre_rol`; el módulo de auth elige el que coincide con GameUP.
 */

/** Si el perfil viene envuelto ({ data: {...} } o { usuario: {...} }). */
const ENVOLTORIOS = ['data', 'usuario', 'user', 'perfil'] as const;
const CAMPOS_ID = ['id_usuario', 'idUsuario', 'id'] as const;
const CAMPOS_NOMBRES = [
  'nombres',
  'nombre',
  'nombre_usuario',
  'nombreUsuario',
] as const;
const CAMPOS_APELLIDOS = [
  'apellidos',
  'apellido',
  'apellido_usuario',
  'apellidoUsuario',
] as const;
const CAMPOS_CORREO = [
  'correo',
  'correo_usuario',
  'correoUsuario',
  'email',
] as const;
/** Donde puede venir la lista (o un solo rol). */
const CAMPOS_ROLES = [
  'roles',
  'rol_usuario',
  'rolUsuario',
  'rol',
  'nombre_rol',
  'nombreRol',
] as const;
/** Dentro de un objeto de rol. */
const CAMPOS_NOMBRE_ROL = ['nombre_rol', 'nombreRol', 'nombre'] as const;

type Objeto = Record<string, unknown>;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function primero(obj: Objeto, campos: readonly string[]): unknown {
  for (const campo of campos) {
    if (obj[campo] !== undefined && obj[campo] !== null) return obj[campo];
  }
  return undefined;
}

function texto(obj: Objeto, campos: readonly string[]): string | null {
  const valor = primero(obj, campos);
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}

function idNumerico(valor: unknown): bigint | null {
  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0) {
    return BigInt(valor);
  }
  if (typeof valor === 'string' && /^[1-9]\d{0,18}$/.test(valor)) {
    return BigInt(valor);
  }
  return null;
}

/** Acepta "TALLERISTA", { nombre_rol }, { rol: { nombre_rol } } o listas de ellos. */
function nombresDeRol(valor: unknown): string[] {
  if (typeof valor === 'string') return valor.trim() ? [valor.trim()] : [];
  if (Array.isArray(valor)) return valor.flatMap(nombresDeRol);
  if (esObjeto(valor)) {
    const nombre = texto(valor, CAMPOS_NOMBRE_ROL);
    if (nombre) return [nombre];
    if (valor['rol'] !== undefined) return nombresDeRol(valor['rol']);
  }
  return [];
}

/** Devuelve null si la respuesta no tiene la forma esperada. */
export function mapearPerfil(json: unknown): IdentidadExterna | null {
  if (!esObjeto(json)) return null;

  let perfil: Objeto = json;
  for (const envoltorio of ENVOLTORIOS) {
    const interno = json[envoltorio];
    if (esObjeto(interno) && primero(perfil, CAMPOS_ID) === undefined) {
      perfil = interno;
    }
  }

  const idUsuarioAuth = idNumerico(primero(perfil, CAMPOS_ID));
  if (idUsuarioAuth === null) return null;

  const roles = [
    ...new Set(CAMPOS_ROLES.flatMap((campo) => nombresDeRol(perfil[campo]))),
  ];

  return {
    idUsuarioAuth,
    roles,
    nombres: texto(perfil, CAMPOS_NOMBRES),
    apellidos: texto(perfil, CAMPOS_APELLIDOS),
    correo: texto(perfil, CAMPOS_CORREO),
  };
}
