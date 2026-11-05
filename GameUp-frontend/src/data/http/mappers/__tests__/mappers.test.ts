import { ServerError } from '@/services/apiErrors';
import { toAuthSession, toStaffProfile, toUserRole } from '../sessionMapper';
import { toStudentProfile } from '../studentMapper';

describe('mapeadores de sesión', () => {
  it.each(['student', 'teacher', 'guardian', 'director'])(
    'acepta el rol %s',
    (role) => {
      expect(toUserRole(role)).toBe(role);
    },
  );

  it.each(['TALLERISTA', 'admin', '', null, 3])(
    'rechaza un rol desconocido (%p)',
    (role) => {
      expect(() => toUserRole(role)).toThrow(ServerError);
    },
  );

  it('traduce la sesión del backend a AuthSession', () => {
    expect(
      toAuthSession({
        userId: '12',
        role: 'teacher',
        displayName: 'Ana Gómez',
      }),
    ).toEqual({ userId: '12', role: 'teacher', displayName: 'Ana Gómez' });
  });

  it('el perfil del adulto usa userId como id', () => {
    expect(
      toStaffProfile({ userId: '7', role: 'guardian', displayName: 'Luz P.' }),
    ).toEqual({ id: '7', displayName: 'Luz P.' });
  });

  it('falla con un error claro si falta un campo', () => {
    expect(() =>
      toAuthSession({ userId: '', role: 'student', displayName: 'X' }),
    ).toThrow('userId');
  });
});

describe('mapeador del estudiante', () => {
  it('se queda solo con lo que usa la app', () => {
    expect(
      toStudentProfile({
        id: '31',
        displayName: 'Martín',
        personajeAvatar: 'osito',
        nivel: { id: '1', nombre: 'BAJO' },
      }),
    ).toEqual({ id: '31', displayName: 'Martín' });
  });
});
