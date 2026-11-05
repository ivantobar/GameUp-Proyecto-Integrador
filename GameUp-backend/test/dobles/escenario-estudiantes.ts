import type { UsuarioAutenticado } from '../../src/common/auth/usuario-autenticado.js';
import { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import { UsuariosEnMemoria, usuarioDePrueba } from './usuarios-en-memoria.js';
import { identidad } from './verificador-token-falso.js';

/**
 * Escenario ficticio para las pruebas de estudiantes (sin datos reales):
 *
 *   Directora 1
 *   Tallerista 2 → a cargo de 10 y 11
 *   Tallerista 3 → a cargo de 12; antes tuvo a 10 (vínculo inactivo)
 *   Acudiente 4  → de 10 (principal)
 *   Acudiente 5  → de 12
 *   Acudiente 6  → cuenta desactivada, sin estudiantes
 *   Estudiantes 10 (Martín José Cruz Pérez), 11 (egresada), 12 (Lucas)
 *
 * El id de la API de seguridad de cada uno es id × 100 (ver usuarioDePrueba).
 */
export function escenarioEstudiantes() {
  const usuarios = new UsuariosEnMemoria([
    usuarioDePrueba(1, 'DIRECTORA', {
      nombres: 'Diana',
      apellidos: 'Directora',
    }),
    usuarioDePrueba(2, 'TALLERISTA', {
      nombres: 'Ana María',
      apellidos: 'Gómez Ruiz',
    }),
    usuarioDePrueba(3, 'TALLERISTA', { nombres: 'Tomás', apellidos: 'Rey' }),
    usuarioDePrueba(4, 'ACUDIENTE', { nombres: 'Laura', apellidos: 'Cruz' }),
    usuarioDePrueba(5, 'ACUDIENTE', { nombres: 'Pedro', apellidos: 'Mora' }),
    usuarioDePrueba(6, 'ACUDIENTE', { activo: false }),
    usuarioDePrueba(10, 'ESTUDIANTE', {
      nombres: 'Martín José',
      apellidos: 'Cruz Pérez',
    }),
    usuarioDePrueba(11, 'ESTUDIANTE', {
      nombres: 'Sofía',
      apellidos: 'Lara',
      estudiante: {
        idEstudianteExterno: 11000n,
        nivelId: 2n,
        estado: 'EGRESADO',
      },
    }),
    usuarioDePrueba(12, 'ESTUDIANTE', { nombres: 'Lucas', apellidos: 'Mora' }),
  ]);
  const estudiantes = new EstudiantesEnMemoria(usuarios, {
    talleristas: [
      { talleristaId: 2, estudianteId: 10 },
      { talleristaId: 2, estudianteId: 11 },
      { talleristaId: 3, estudianteId: 12 },
      { talleristaId: 3, estudianteId: 10, activo: false },
    ],
    acudientes: [
      {
        acudienteId: 4,
        estudianteId: 10,
        parentesco: 'Madre',
        esPrincipal: true,
      },
      { acudienteId: 5, estudianteId: 12, parentesco: 'Padre' },
    ],
  });
  return { usuarios, estudiantes };
}

const actor = (
  id: number,
  rol: UsuarioAutenticado['rol'],
): UsuarioAutenticado => ({
  id: BigInt(id),
  idUsuarioAuth: BigInt(id * 100),
  rol,
});

export const DIRECTORA = actor(1, 'DIRECTORA');
export const TALLERISTA_2 = actor(2, 'TALLERISTA');
export const TALLERISTA_3 = actor(3, 'TALLERISTA');
export const ACUDIENTE_4 = actor(4, 'ACUDIENTE');
export const ACUDIENTE_5 = actor(5, 'ACUDIENTE');
export const ESTUDIANTE_10 = actor(10, 'ESTUDIANTE');

/** Tokens para el VerificadorTokenFalso de las pruebas e2e. */
export const TOKENS_ESCENARIO = {
  directora: identidad(100, ['ADMIN'], {
    nombres: 'Diana',
    apellidos: 'Directora',
  }),
  tallerista2: identidad(200, ['TALLERISTA'], {
    nombres: 'Ana María',
    apellidos: 'Gómez Ruiz',
  }),
  tallerista3: identidad(300, ['TALLERISTA'], {
    nombres: 'Tomás',
    apellidos: 'Rey',
  }),
  acudiente4: identidad(400, ['ACUDIENTE'], {
    nombres: 'Laura',
    apellidos: 'Cruz',
  }),
  acudiente5: identidad(500, ['ACUDIENTE'], {
    nombres: 'Pedro',
    apellidos: 'Mora',
  }),
  estudiante10: identidad(1000, ['ESTUDIANTE'], {
    nombres: 'Martín José',
    apellidos: 'Cruz Pérez',
  }),
};
