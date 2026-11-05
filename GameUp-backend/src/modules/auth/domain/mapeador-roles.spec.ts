import { MapeadorRoles } from './mapeador-roles.js';

describe('MapeadorRoles', () => {
  it.each([
    ['ADMIN', 'DIRECTORA'],
    ['TALLERISTA', 'TALLERISTA'],
    ['ACUDIENTE', 'ACUDIENTE'],
    ['ESTUDIANTE', 'ESTUDIANTE'],
    [' tallerista ', 'TALLERISTA'],
    ['Admin', 'DIRECTORA'],
    ['ESTUDIANTÉ', 'ESTUDIANTE'], // tilde de más: se ignora
  ])('%j → %s', (externo, gameup) => {
    expect(MapeadorRoles.aRolGameUp(externo)).toBe(gameup);
  });

  it.each(['DONANTE', 'DIRECTORA', 'PSICOLOGO', '', 'SUPERADMIN'])(
    '%j no tiene acceso a GameUP',
    (externo) => {
      expect(MapeadorRoles.aRolGameUp(externo)).toBeNull();
    },
  );

  it('con varios roles devuelve solo los que tienen acceso, sin repetir', () => {
    expect(
      MapeadorRoles.aRolesGameUp([
        'DONANTE',
        'TALLERISTA',
        'tallerista',
        'ADMIN',
      ]),
    ).toEqual(['TALLERISTA', 'DIRECTORA']);
  });

  it.each([
    ['DIRECTORA', 'director'],
    ['TALLERISTA', 'teacher'],
    ['ACUDIENTE', 'guardian'],
    ['ESTUDIANTE', 'student'],
  ] as const)('rol de la app: %s → %s', (rol, app) => {
    expect(MapeadorRoles.aRolApp(rol)).toBe(app);
  });
});
