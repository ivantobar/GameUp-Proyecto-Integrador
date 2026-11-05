import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';

export const ESTADOS_ESTUDIANTE = ['ACTIVO', 'EGRESADO', 'RETIRADO'] as const;
export type EstadoEstudiante = (typeof ESTADOS_ESTUDIANTE)[number];

/** Datos propios de GameUP de un estudiante (tabla estudiante). */
export interface PerfilEstudiante {
  /** idEstudiante en la API del núcleo familiar. */
  idEstudianteExterno: bigint;
  nivelId: bigint;
  estado: EstadoEstudiante;
}

export interface PropiedadesUsuario {
  id: bigint;
  idUsuarioAuth: bigint;
  rol: RolGameUp;
  nombres: string;
  apellidos: string;
  correo: string | null;
  activo: boolean;
  /** idAcudiente en la API del núcleo familiar (solo acudientes). */
  idAcudienteExterno: bigint | null;
  /** Solo si el rol es ESTUDIANTE. */
  estudiante: PerfilEstudiante | null;
  creadoEn: Date;
  ultimoAcceso: Date | null;
  sincronizadoEn: Date | null;
}

/**
 * Usuario de GameUP: copia mínima de la persona (sin contraseña, documento,
 * teléfono ni fecha de nacimiento), enlazada por sus ids externos.
 */
export class Usuario {
  readonly id: bigint;
  readonly idUsuarioAuth: bigint;
  readonly rol: RolGameUp;
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string | null;
  readonly activo: boolean;
  readonly idAcudienteExterno: bigint | null;
  readonly estudiante: PerfilEstudiante | null;
  readonly creadoEn: Date;
  readonly ultimoAcceso: Date | null;
  readonly sincronizadoEn: Date | null;

  constructor(p: PropiedadesUsuario) {
    this.id = p.id;
    this.idUsuarioAuth = p.idUsuarioAuth;
    this.rol = p.rol;
    this.nombres = p.nombres;
    this.apellidos = p.apellidos;
    this.correo = p.correo;
    this.activo = p.activo;
    this.idAcudienteExterno = p.idAcudienteExterno;
    this.estudiante = p.estudiante;
    this.creadoEn = p.creadoEn;
    this.ultimoAcceso = p.ultimoAcceso;
    this.sincronizadoEn = p.sincronizadoEn;
  }

  /**
   * Nombre con el que la app saluda o muestra a la persona:
   * al estudiante, solo su primer nombre («Martín»); a los adultos, primer
   * nombre y primer apellido («Ana Gómez»).
   */
  nombreVisible(): string {
    const nombre = primeraPalabra(this.nombres);
    if (this.rol === 'ESTUDIANTE') return nombre;
    const apellido = primeraPalabra(this.apellidos);
    return apellido ? `${nombre} ${apellido}` : nombre;
  }
}

function primeraPalabra(texto: string): string {
  return texto.trim().split(/\s+/)[0] ?? '';
}
