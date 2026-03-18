import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts } from '../controllers/productController.js';
import Product from '../models/product.js';

vi.mock('../models/product.js');

describe('Product Controller - Pagination Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockReqRes = (query = {}) => {
        const res = {
            json: vi.fn(),
        };
        return {
            req: { query },
            res,
            next: vi.fn()
        };
    };

    it('Debe calcular correctamente el skip basado en la página y el límite', async () => {
        const { req, res, next } = createMockReqRes({ page: '2', limit: '5' });

        // Mock de encadenamiento de Mongoose
        const mockQuery = {
            populate: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            sort: vi.fn().mockResolvedValue([{ name: 'P1' }])
        };

        Product.find = vi.fn().mockReturnValue(mockQuery);
        Product.countDocuments = vi.fn().mockResolvedValue(15);

        await getProducts(req, res, next);

        // Skip para página 2, límite 5 = (2-1)*5 = 5
        expect(mockQuery.skip).toHaveBeenCalledWith(5);
        expect(mockQuery.limit).toHaveBeenCalledWith(5);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            pagination: expect.objectContaining({
                totalPages: 3,
                currentPage: 2
            })
        }));
    });

    it('Debe usar valores por defecto si no se envían parámetros', async () => {
        const { req, res, next } = createMockReqRes({});
        const mockQuery = {
            populate: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            sort: vi.fn().mockResolvedValue([])
        };
        Product.find = vi.fn().mockReturnValue(mockQuery);
        Product.countDocuments = vi.fn().mockResolvedValue(0);

        await getProducts(req, res, next);

        expect(mockQuery.skip).toHaveBeenCalledWith(0); // (1-1)*10
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
});
