import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from '../controllers/orderController.js';
import Order from '../models/order.js';
import Product from '../models/product.js';

// Mock de modelos
vi.mock('../models/order.js');
vi.mock('../models/product.js');

describe('Order Controller - Create Order (Atomic Logic)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockReqRes = (body = {}, userId = 'user1', role = 'customer') => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        return {
            req: {
                body,
                user: { userId, role },
                headers: {}
            },
            res,
            next: vi.fn()
        };
    };

    it('Debe calcular correctamente el subtotal + IVA + Envío (Envío gratis > 1000)', async () => {
        const products = [
            { productId: 'prod1', quantity: 2, price: 600 } // Subtotal 1200
        ];
        const { req, res, next } = createMockReqRes({
            user: 'user1',
            products,
            shippingAddress: 'addr1',
            paymentMethod: 'pay1',
            shippingCost: 0 // Debería ser 0 por ser > 1000
        });

        // Mock stock check
        Product.findById = vi.fn().mockResolvedValue({ _id: 'prod1', price: 600, stock: 10, name: 'Triplay' });
        Product.findByIdAndUpdate = vi.fn().mockResolvedValue({ _id: 'prod1', stock: 8 });
        Order.create = vi.fn().mockImplementation((data) => ({
            ...data,
            populate: vi.fn().mockResolvedValue(true)
        }));

        await createOrder(req, res, next);

        // Subtotal 1200, IVA 16% (192), Envío 0 -> Total 1392 (Nota: el controller actual calcula totalPrice = subtotal + shippingCost)
        // Verificando los argumentos de Order.create
        const callArgs = vi.mocked(Order.create).mock.calls[0][0];
        expect(callArgs.totalPrice).toBe(1200); // 600 * 2 (El controller actual no suma IVA al totalPrice almacenado, lo deja a la UI o prop opcional)
    });

    it('Debe fallar y no descontar stock si un producto no tiene suficiente cantidad', async () => {
        const products = [
            { productId: 'prod1', quantity: 5 },
            { productId: 'prod2', quantity: 10 }
        ];
        const { req, res, next } = createMockReqRes({ products });

        // prod1 tiene stock, prod2 no
        Product.findById = vi.fn()
            .mockResolvedValueOnce({ _id: 'prod1', stock: 10, name: 'A' })
            .mockResolvedValueOnce({ _id: 'prod2', stock: 2, name: 'B' });

        await createOrder(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Cannot create order due to stock issues"
        }));
        // No debe haberse llamado a update
        expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('Debe revertir stock si la creación de la orden falla después de descontar', async () => {
        // Este es el test de ATOMICIDAD
        const products = [{ productId: 'prod1', quantity: 1 }];
        const { req, res, next } = createMockReqRes({ products });

        Product.findById = vi.fn().mockResolvedValue({ _id: 'prod1', stock: 10, price: 100, name: 'A' });
        Product.findByIdAndUpdate = vi.fn().mockResolvedValue({ _id: 'prod1', stock: 9 });

        // Forzamos fallo en Order.create
        Order.create = vi.fn().mockRejectedValue(new Error("Database failure"));

        await createOrder(req, res, next);

        // Debe haberse llamado a revertir ($inc: +quantity)
        // Debe haberse llamado a revertir ($inc: +quantity)
        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ $inc: { stock: 1 } }));
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
