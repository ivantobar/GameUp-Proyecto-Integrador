import type { EstadoEstudiante } from '../../usuarios/domain/usuario.entity.js';

export interface NivelResumen {
  id: bigint;
  nombre: string;
}

/** Persona adulta que aparece junto a un estudiante (tallerista, acudiente, directora). */
export interface PersonaResumen {
  id: bigint;
  nombres: string;
  apellidos: string;
}

export interface PropiedadesEstudiante {
  /** usuario.id del estudiante (estudiante.usuario_id). */
  id: bigint;
  nombres: string;
  apellidos: string;
  /** usuario.activo: si la cuenta puede iniciar sesión. */
  cuentaActiva: boolean;
  estado: EstadoEstudiante;
  nivel: NivelResumen;
  fechaIngreso: Date;
  personajeAvatar: string | null;
  /** idEstudiante en la API del núcleo familiar (no se expone fuera de la directora). */
  idEstudianteExterno: bigint;
}

function palabras(texto: string): string[] {
  return texto.trim().split(/\s+/).filter(Boolean);
}

type Nombre = { nombres: string; apellidos: string };

/** «Martín» (como saluda la app al niño). */
export function primerNombreDe(p: Nombre): string {
  return palabras(p.nombres)[0] ?? '';
}

/** «Martín C.» (como lo ve el tallerista). */
export function nombreCortoDe(p: Nombre): string {
  const inicial = palabras(p.apellidos)[0]?.charAt(0);
  return inicial
    ? `${primerNombreDe(p)} ${inicial.toUpperCase()}.`
    : primerNombreDe(p);
}

/** «MC» (el círculo con iniciales). */
export function inicialesDe(p: Nombre): string {
  const n = primerNombreDe(p).charAt(0);
  const a = palabras(p.apellidos)[0]?.charAt(0) ?? '';
  return `${n}${a}`.toUpperCase();
}

/** Estudiante de la fundación tal como lo maneja GameUP. */
export class Estudiante {
  readonly id: bigint;
  readonly nombres: string;
  readonly apellidos: string;
  readonly cuentaActiva: boolean;
  readonly estado: EstadoEstudiante;
  readonly nivel: NivelResumen;
  readonly fechaIngreso: Date;
  readonly personajeAvatar: string | null;
  readonly idEstudianteExterno: bigint;

  constructor(p: PropiedadesEstudiante) {
    this.id = p.id;
    this.nombres = p.nombres;
    this.apellidos = p.apellidos;
    this.cuentaActiva = p.cuentaActiva;
    this.estado = p.estado;
    this.nivel = p.nivel;
    this.fechaIngreso = p.fechaIngreso;
    this.personajeAvatar = p.personajeAvatar;
    this.idEstudianteExterno = p.idEstudianteExterno;
  }

  /** «Martín» (como saluda la app al niño). */
  primerNombre(): string {
    return primerNombreDe(this);
  }

  /** «Martín C.» (como lo ve el tallerista). */
  nombreCorto(): string {
    return nombreCortoDe(this);
  }

  /** «MC» (el círculo con iniciales). */
  iniciales(): string {
    return inicialesDe(this);
  }

  estaActivo(): boolean {
    return this.estado === 'ACTIVO';
  }
}

/** Un cambio de nivel (tabla historial_nivel). */
export interface CambioNivel {
  id: bigint;
  nivel: NivelResumen;
  motivo: string | null;
  fecha: Date;
  asignadoPor: PersonaResumen;
}

/** Tallerista vinculada a un estudiante (tabla tallerista_estudiante). */
export interface TalleristaAsignada {
  tallerista: PersonaResumen;
  fechaInicio: Date;
  /** false: ya no está a cargo (se conserva el historial). */
  activo: boolean;
}

/** Acudiente vinculado a un estudiante (tabla acudiente_estudiante). */
export interface VinculoAcudiente {
  acudiente: PersonaResumen;
  parentesco: string;
  esPrincipal: boolean;
}
