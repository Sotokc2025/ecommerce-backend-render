import { describe, it, expect, vi, beforeEach } from 'vitest';
import authMiddleware from '../middlewares/authMiddleware.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('Middleware Tests - Auth & Admin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockReqRes = (headers = {}) => {
        const req = { headers };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        return { req, res, next };
    };

    it('authMiddleware - Debe fallar si no hay header Authorization', async () => {
        const { req, res, next } = createMockReqRes();
        await authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it('isAdmin - Debe fallar si el rol no es admin', () => {
        const req = { user: { role: 'customer' } };
        const { res, next } = createMockReqRes();

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Admin access required" });
    });

    it('isAdmin - Debe permitir acceso si el rol es admin', () => {
        const req = { user: { role: 'admin' } };
        const { res, next } = createMockReqRes();

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
