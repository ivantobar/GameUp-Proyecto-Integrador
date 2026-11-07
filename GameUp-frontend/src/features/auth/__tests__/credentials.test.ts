import { hasErrors, normalizeEmail, validateCredentials } from '../credentials';
import { roleHomes } from '../roleHome';

describe('validateCredentials', () => {
  it('pide el correo y la contraseña cuando faltan', () => {
    const errors = validateCredentials({ email: '  ', password: '' });
    expect(errors).toEqual({
      email: 'Escribe tu correo.',
      password: 'Escribe tu contraseña.',
    });
    expect(hasErrors(errors)).toBe(true);
  });

  it('avisa si el correo no tiene la forma de un correo', () => {
    const errors = validateCredentials({ email: 'docente', password: 'x' });
    expect(errors.email).toMatch(/Revisa el correo/);
    expect(errors.password).toBeUndefined();
  });

  it('acepta un correo con espacios o mayúsculas', () => {
    const errors = validateCredentials({
      email: ' Docente@GameUP.test ',
      password: 'x',
    });
    expect(hasErrors(errors)).toBe(false);
    expect(normalizeEmail(' Docente@GameUP.test ')).toBe('docente@gameup.test');
  });
});

describe('roleHomes', () => {
  it('cada rol tiene su inicio (también la directora)', () => {
    expect(roleHomes).toEqual({
      student: '/student',
      teacher: '/teacher',
      guardian: '/guardian',
      director: '/director',
    });
  });
});
