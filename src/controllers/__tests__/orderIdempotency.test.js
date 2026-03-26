// @ts-check
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from '../orderController.js';
import Order from '../../models/order.js';
import Product from '../../models/product.js';

vi.mock('../../models/order.js');
vi.mock('../../models/product.js');

describe('Order Controller - Idempotency', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockReqRes = (body = {}, headers = {}, userId = 'user1') => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        return {
            req: {
                body,
                headers,
                user: { userId, role: 'customer' }
            },
            res,
            next: vi.fn()
        };
    };

    it('Debe retornar la orden existente si se provee la misma idempotency-key', async () => {
        const idempotencyKey = 'key-123';
        const { req, res, next } = createMockReqRes({ user: 'user1' }, { 'idempotency-key': idempotencyKey });

        const mockOrder = { _id: 'order1', idempotencyKey };

        // Mock findOne chainable populates
        const mockQuery = {
            populate: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation(callback => callback(mockOrder)),
            catch: vi.fn().mockReturnThis()
        };
        Order.findOne = vi.fn().mockReturnValue(mockQuery);

        await createOrder(req, res, next);

        expect(Order.findOne).toHaveBeenCalledWith({ idempotencyKey });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('Debe crear una nueva orden si la idempotency-key es nueva', async () => {
        const idempotencyKey = 'new-key';
        const { req, res, next } = createMockReqRes(
            { user: 'user1', products: [{ productId: 'p1', quantity: 1 }] },
            { 'idempotency-key': idempotencyKey }
        );

        // Mock findOne to return null (new order flow)
        const mockQueryNull = {
            populate: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation(callback => callback(null))
        };
        Order.findOne = vi.fn().mockReturnValue(mockQueryNull);

        Product.findById = vi.fn().mockResolvedValue({ _id: 'p1', stock: 10, price: 100, name: 'A' });
        Product.findByIdAndUpdate = vi.fn().mockResolvedValue(true);

        const mockNewOrder = {
            _id: 'new-order',
            populate: vi.fn().mockResolvedValue(true)
        };
        Order.create = vi.fn().mockResolvedValue(mockNewOrder);

        await createOrder(req, res, next);

        expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey }));
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
