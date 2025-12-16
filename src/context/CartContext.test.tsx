// src/context/CartContext.test.tsx
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import { ReactNode } from "react";

// Mock de productService
vi.mock("../utils/productService", () => ({
  getProductById: vi.fn((id: string) => {
    const productos: any = {
      "1": { id: "1", nombre: "PS5", precio: 500000, stock: 10 },
      "2": { id: "2", nombre: "Xbox", precio: 400000, stock: 5 },
      "3": { id: "3", nombre: "Switch", precio: 300000, stock: 2 },
    };
    return Promise.resolve(productos[id]);
  }),
}));

// Mock de AuthContext
vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", nombre: "Test User", correo: "test@test.com" },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock de cartsApi
vi.mock("../services/api", () => ({
  cartsApi: {
    getMyCart: vi.fn(() =>
      Promise.resolve({
        cart: { cartItems: [] },
        total: 0,
      })
    ),
    addToCart: vi.fn((data) => {
      // Simular respuesta del backend después de agregar
      return Promise.resolve({
        cart: {
          cartItems: [
            {
              id: 1,
              productId: data.productId,
              quantity: data.quantity,
              unitPrice: data.productId === 1 ? 500000 : data.productId === 2 ? 400000 : 300000,
            },
          ],
        },
        total: data.productId === 1 ? 500000 : data.productId === 2 ? 400000 : 300000,
      });
    }),
    removeItem: vi.fn(() =>
      Promise.resolve({
        cart: { cartItems: [] },
        total: 0,
      })
    ),
    updateQuantity: vi.fn((cartItemId, data) =>
      Promise.resolve({
        cart: {
          cartItems: [
            {
              id: cartItemId,
              productId: 1,
              quantity: data.quantity,
              unitPrice: 500000,
            },
          ],
        },
        total: 500000 * data.quantity,
      })
    ),
    clearCart: vi.fn(() =>
      Promise.resolve({
        cart: { cartItems: [] },
        total: 0,
      })
    ),
  },
}));

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

// Mock de alert
globalThis.alert = vi.fn();

// Mock de document.getElementById para updateCartCountInDOM
globalThis.document.getElementById = vi.fn(() => ({
  textContent: "",
})) as any;

// Wrapper para el provider
const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext - Pruebas Esenciales', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Asegurar que localStorage tenga un token para simular usuario autenticado
    localStorage.setItem("token", "fake-token");
  });

  test.skip('Debe agregar un producto al carrito', async () => {
    //! 1 - Arrange
    const { result } = renderHook(() => useCart(), { wrapper });

    // Esperar a que el carrito se inicialice (refreshCart)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    //! 2 - Act
    await act(async () => {
      await result.current.addToCart("1");
    });

    //! 3 - Assert
    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(1);
    }, { timeout: 3000 });
    expect(result.current.carrito[0].productId).toBe(1);
    expect(result.current.carrito[0].quantity).toBe(1);
  }, 10000);

  test.skip('Debe eliminar un producto del carrito', async () => {
    //! 1 - Arrange
    const { result } = renderHook(() => useCart(), { wrapper });

    // Esperar a que el carrito se inicialice
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    // Agregar un producto primero
    await act(async () => {
      await result.current.addToCart("1");
    });

    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(1);
    }, { timeout: 3000 });

    //! 2 - Act
    await act(async () => {
      await result.current.removeFromCart(1);
    });

    //! 3 - Assert
    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(0);
    }, { timeout: 3000 });
  }, 15000);

  test.skip('Debe calcular el total del carrito correctamente', async () => {
    //! 1 - Arrange
    const { result } = renderHook(() => useCart(), { wrapper });

    // Esperar a que el carrito se inicialice
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    //! 2 - Act
    await act(async () => {
      await result.current.addToCart("1"); // PS5: 500000
    });

    //! 3 - Assert
    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(1);
    }, { timeout: 3000 });
    const total = result.current.getCartTotal();
    expect(total).toBe(500000);
  }, 10000);

  test.skip('Debe vaciar el carrito completamente', async () => {
    //! 1 - Arrange
    const { result } = renderHook(() => useCart(), { wrapper });

    // Esperar a que el carrito se inicialice
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });

    // Agregar productos primero
    await act(async () => {
      await result.current.addToCart("1");
    });

    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(1);
    }, { timeout: 2000 });

    //! 2 - Act
    await act(async () => {
      await result.current.clearCart();
    });

    //! 3 - Assert
    await waitFor(() => {
      expect(result.current.carrito).toHaveLength(0);
    }, { timeout: 2000 });
    expect(result.current.getCartTotal()).toBe(0);
    expect(result.current.getCartCount()).toBe(0);
  });
});