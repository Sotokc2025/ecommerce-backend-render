// @ts-check
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCartByUser, addProductToCart, clearCartItems } from '../cartController.js';
import Cart from '../../models/cart.js';

vi.mock('../../models/cart.js');

describe('Cart Controller - BOLA Security Fixes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockReqRes = (params = {}, body = {}, userId = 'user1', role = 'customer') => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        return {
            req: {
                params,
                body,
                user: { userId, role }
            },
            res,
            next: vi.fn()
        };
    };

    it('getCartByUser - Debe denegar acceso si el usuario intenta ver el carrito de otro', async () => {
        const { req, res, next } = createMockReqRes({ id: 'otherUser' }, {}, 'user1', 'customer');

        await getCartByUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining("Forbidden")
        }));
    });

    it('getCartByUser - Debe permitir acceso si el usuario pide su propio carrito', async () => {
        const { req, res, next } = createMockReqRes({ id: 'user1' }, {}, 'user1', 'customer');

        Cart.findOne = vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnThis(),
            populate: vi.fn().mockResolvedValue({ user: 'user1', products: [] })
        });

        await getCartByUser(req, res, next);

        // Core logic check: it should NOT return 403 Forbidden
        expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('addProductToCart - Debe usar el userId del token, ignorando el enviado en el body', async () => {
        // En el body enviamos 'otherUser', pero el token es 'user1'
        const { req, res, next } = createMockReqRes({}, { userId: 'otherUser', productId: 'p1' }, 'user1');

        Cart.findOne = vi.fn().mockReturnValue({
            user: 'user1',
            products: [],
            save: vi.fn().mockResolvedValue(true),
            populate: vi.fn().mockReturnThis()
        });

        await addProductToCart(req, res, next);

        // Verificamos que buscó por 'user1' (del token) y NO por 'otherUser'
        expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user1' });
    });

    it('clearCartItems - Debe limpiar el carrito del usuario del token', async () => {
        const { req, res, next } = createMockReqRes({}, { userId: 'otherUser' }, 'user1');

        const mockCart = {
            user: 'user1',
            products: [{ p: 1 }],
            save: vi.fn().mockResolvedValue(true),
            populate: vi.fn().mockReturnThis()
        };
        Cart.findOne = vi.fn().mockResolvedValue(mockCart);

        await clearCartItems(req, res, next);

        expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user1' });
        expect(mockCart.products).toEqual([]);
    });
});
