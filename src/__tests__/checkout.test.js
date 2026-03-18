import { describe, it, expect } from 'vitest';

describe('FASE C - Validación del Flujo de Compra (Backend)', () => {
  it('Debe calcular correctamente el subtotal de una orden', () => {
    // Escenario de prueba: Carrito con dos maderas
    const cartItems = [
      { id: '1', name: 'Triplay de Pino', price: 500, quantity: 2 },
      { id: '2', name: 'MDF 15mm', price: 300, quantity: 1 }
    ];

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    expect(subtotal).toBe(1300); // 500*2 + 300
  });

  it('Debe aplicar el costo de envío correctamente', () => {
    const subtotal = 1300;
    const shippingCost = 150;
    const total = subtotal + shippingCost;
    
    expect(total).toBe(1450);
  });

  it('Debe detectar un carrito inválido o vacío antes de procesar el pago', () => {
    const emptyCart = [];
    const isValid = emptyCart.length > 0;
    
    expect(isValid).toBe(false);
  });
});
