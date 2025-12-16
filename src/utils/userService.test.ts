// src/utils/userService.test.ts
import { describe, expect, test, beforeEach, vi } from "vitest";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "./userService";

// Mock de usersApi
vi.mock("../services/api", () => ({
  usersApi: {
    getAll: vi.fn(() =>
      Promise.resolve([
        { id: 1, nombre: "Usuario 1", correo: "user1@test.com", rol: "CLIENTE" },
        { id: 2, nombre: "Usuario 2", correo: "user2@test.com", rol: "CLIENTE" },
      ])
    ),
    getById: vi.fn((id: number) =>
      Promise.resolve({
        id,
        nombre: "Usuario Test",
        correo: "test@test.com",
        rol: "CLIENTE",
      })
    ),
    create: vi.fn((data) =>
      Promise.resolve({
        id: Date.now(),
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        rut: data.rut,
        rol: data.rol || "CLIENTE",
      })
    ),
    update: vi.fn((id, data) =>
      Promise.resolve({
        id,
        ...data,
      })
    ),
    delete: vi.fn(() => Promise.resolve()),
  },
}));

// Mock simple de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

describe('UserService - Pruebas Esenciales', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('Debe obtener la lista de usuarios', async () => {
    //! 1 - Arrange & Act
    const usuarios = await getUsers();

    //! 2 - Assert
    expect(Array.isArray(usuarios)).toBe(true);
    expect(usuarios.length).toBeGreaterThan(0);
  });

  test('Debe crear un nuevo usuario con ID único', async () => {
    //! 1 - Arrange
    const datos: Partial<User> & { password?: string } = {
      nombre: "Juan",
      apellidos: "Pérez",
      correo: "juan.perez@example.com",
      rut: "12345678-9",
      region: "Metropolitana",
      comuna: "Santiago",
      rol: "CLIENTE",
      password: "12345678",
    };

    //! 2 - Act
    const usuario = await createUser(datos);

    //! 3 - Assert
    expect(usuario.id).toBeDefined();
    expect(usuario.nombre).toBe("Juan");
    expect(usuario.correo).toBe("juan.perez@example.com");
  });

  test('Debe actualizar un usuario existente', async () => {
    //! 1 - Arrange
    const datos: Partial<User> & { password?: string } = {
      nombre: "María",
      apellidos: "González",
      correo: "maria@example.com",
      telefono: "123456789",
      password: "12345678",
    };
    const usuario = await createUser(datos);

    //! 2 - Act
    const resultado = await updateUser({
      id: usuario.id,
      nombre: "María José",
      telefono: "987654321",
    });

    //! 3 - Assert
    expect(resultado).toBe(true);
  });

  test('Debe eliminar un usuario existente', async () => {
    //! 1 - Arrange
    const datos: Partial<User> & { password?: string } = {
      nombre: "Carlos",
      correo: "carlos@example.com",
      password: "12345678",
    };
    const usuario = await createUser(datos);

    //! 2 - Act
    const resultado = await deleteUser(usuario.id);

    //! 3 - Assert
    expect(resultado).toBe(true);
  });
});