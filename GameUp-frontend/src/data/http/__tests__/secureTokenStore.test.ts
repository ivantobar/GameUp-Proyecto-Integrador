import * as SecureStore from 'expo-secure-store';
import { createSecureTokenStore } from '../secureTokenStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('guardado')),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('token en el almacén seguro', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lee el almacén una sola vez y luego usa la copia en memoria', async () => {
    const store = createSecureTokenStore();

    await expect(store.get()).resolves.toBe('guardado');
    await expect(store.get()).resolves.toBe('guardado');

    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
  });

  it('guarda y borra el token en expo-secure-store', async () => {
    const store = createSecureTokenStore();

    await store.set('nuevo');
    await expect(store.get()).resolves.toBe('nuevo');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'gameup.sesion.token',
      'nuevo',
    );

    await store.clear();
    await expect(store.get()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'gameup.sesion.token',
    );
  });
});
