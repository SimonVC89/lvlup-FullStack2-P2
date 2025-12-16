// src/utils/productService.test.ts
import { describe, expect, test, beforeEach, vi } from "vitest";
import {
  getProducts,
  createProduct,
  deleteProduct,
  decrementStock,
  type Product,
  type CartItem,
} from "./productService";

// Variable para simular productos en memoria
let mockProducts: any[] = [
  { id: 1, nombre: "Producto 1", precio: 10000, stock: 10, categoria: "Test", imagen: "/test.jpg" },
  { id: 2, nombre: "Producto 2", precio: 20000, stock: 5, categoria: "Test", imagen: "/test.jpg" },
];

// Mock de productsApi
vi.mock("../services/api", () => ({
  productsApi: {
    getAll: vi.fn(() => Promise.resolve([...mockProducts])),
    getById: vi.fn((id: number) => {
      const product = mockProducts.find((p) => p.id === id);
      return product ? Promise.resolve(product) : Promise.reject(new Error("Not found"));
    }),
    create: vi.fn((data) => {
      const newProduct = {
        id: Date.now(),
        ...data,
      };
      mockProducts.push(newProduct);
      return Promise.resolve(newProduct);
    }),
    update: vi.fn((id, data) => {
      const index = mockProducts.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...data };
        return Promise.resolve(mockProducts[index]);
      }
      return Promise.reject(new Error("Not found"));
    }),
    delete: vi.fn((id) => {
      const index = mockProducts.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProducts.splice(index, 1);
        return Promise.resolve();
      }
      return Promise.reject(new Error("Not found"));
    }),
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

// Mock de window.dispatchEvent
globalThis.window = {
  dispatchEvent: vi.fn(),
} as any;

describe('ProductService - Pruebas Esenciales', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reiniciar mockProducts
    mockProducts = [
      { id: 1, nombre: "Producto 1", precio: 10000, stock: 10, categoria: "Test", imagen: "/test.jpg" },
      { id: 2, nombre: "Producto 2", precio: 20000, stock: 5, categoria: "Test", imagen: "/test.jpg" },
    ];
  });

  test('Debe obtener la lista de productos', async () => {
    //! 1 - Arrange & Act
    const productos = await getProducts();

    //! 2 - Assert
    expect(Array.isArray(productos)).toBe(true);
    expect(productos.length).toBeGreaterThan(0);
  });

  test('Debe crear un nuevo producto con ID único', async () => {
    //! 1 - Arrange
    const datos: Omit<Product, "id"> = {
      nombre: "PlayStation 5",
      precio: 599990,
      descripcion: "Consola de última generación",
      categoria: "Consola",
      stock: 10,
      imagen: "/images/ps5.jpg",
    };

    //! 2 - Act
    const producto = await createProduct(datos);

    //! 3 - Assert
    expect(producto.id).toBeDefined();
    expect(producto.nombre).toBe("PlayStation 5");
    expect(producto.precio).toBe(599990);
  });

  test('Debe eliminar un producto existente', async () => {
    //! 1 - Arrange
    const datos: Omit<Product, "id"> = {
      nombre: "Xbox Series X",
      precio: 499990,
      descripcion: "Consola Xbox",
      categoria: "Consola",
      stock: 5,
      imagen: "/images/xbox.jpg",
    };
    const producto = await createProduct(datos);
    const productosAntes = (await getProducts()).length;

    //! 2 - Act
    const resultado = await deleteProduct(producto.id);
    const productosDespues = (await getProducts()).length;

    //! 3 - Assert
    expect(resultado).toBe(true);
    expect(productosDespues).toBe(productosAntes - 1);
  });

  test('Debe reducir el stock de productos correctamente', async () => {
    //! 1 - Arrange
    const datos: Omit<Product, "id"> = {
      nombre: "Mouse Gamer",
      precio: 30000,
      descripcion: "Mouse RGB",
      categoria: "Mouse",
      stock: 10,
      imagen: "/images/mouse.jpg",
    };
    const producto = await createProduct(datos);
    const items: CartItem[] = [{ id: producto.id, cantidad: 3 }];

    //! 2 - Act
    const resultado = await decrementStock(items);
    const productos = await getProducts();
    const actualizado = productos.find((p: Product) => p.id === producto.id);

    //! 3 - Assert
    expect(resultado.success).toBe(true);
    expect(actualizado?.stock).toBe(7);
  });
});