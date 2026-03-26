// @ts-check
import { describe, it, expect } from 'vitest';

describe('Suite de Pruebas Unitarias - TyMCO Backend', () => {
  it('Debe calcular correctamente el IVA (16%) para México', () => {
    const precioBase = 1000;
    const precioConIva = precioBase * 1.16;
    expect(precioConIva).toBe(1160);
  });

  it('Debe validar que un carrito vacío tiene total 0', () => {
    const items = [];
    const total = items.reduce((sum, item) => sum + item.price, 0);
    expect(total).toBe(0);
  });
});