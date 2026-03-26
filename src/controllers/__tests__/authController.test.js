// @ts-check
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEmail, login, register } from "../authController.js";

// Usar vi.hoisted para variables que se usan en mocks
const { mockUserFindOne, mockUserSave, mockUser, mockBcryptHash, mockBcryptCompare, mockJwtSign } =
  vi.hoisted(() => {
    const mockUserFindOne = vi.fn();
    const mockUserSave = vi.fn();
    const mockUser = function (data) {
      this._id = data._id || "mock_user_id";
      this.displayName = data.displayName;
      this.email = data.email;
      this.hashPassword = data.hashPassword;
      this.role = data.role || "customer";
      this.avatar = data.avatar || "https://placehold.co/100x100.png";
      this.phone = data.phone;
      this.save = mockUserSave;
    };

    const mockBcryptHash = vi.fn();
    const mockBcryptCompare = vi.fn();
    const mockJwtSign = vi.fn();

    return {
      mockUserFindOne,
      mockUserSave,
      mockUser,
      mockBcryptHash,
      mockBcryptCompare,
      mockJwtSign,
    };
  });

// Configurar mocks
vi.mock("../../models/user.js", () => ({
  default: Object.assign(mockUser, {
    findOne: mockUserFindOne,
  }),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: mockJwtSign,
  },
}));

describe("AuthController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Limpiar todos los mocks
    mockUserFindOne.mockReset();
    mockUserSave.mockReset();
    mockBcryptHash.mockReset();
    mockBcryptCompare.mockReset();
    mockJwtSign.mockReset();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      req.body = {
        displayName: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashedPassword123");
      mockUserSave.mockResolvedValue();

      await register(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        _id: expect.anything(),
        displayName: "Test User",
        email: "test@example.com",
        phone: undefined,
        role: "customer",
        avatar: "https://placehold.co/100x100.png"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if user already exists", async () => {
      req.body = {
        displayName: "Test User",
        email: "existing@example.com",
        password: "password123",
      };

      mockUserFindOne.mockResolvedValue({ email: "existing@example.com" });

      await register(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "existing@example.com",
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error when database fails", async () => {
      req.body = {
        displayName: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const dbError = new Error("Database connection failed");
      mockUserFindOne.mockRejectedValue(dbError);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should create user with guest role by default", async () => {
      req.body = {
        displayName: "Guest User",
        email: "guest@example.com",
        password: "password123",
      };

      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashedPassword");
      mockUserSave.mockResolvedValue();

      await register(req, res, next);

      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("login", () => {
    it("should login user successfully and return token", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUserData = {
        _id: "user123",
        displayName: "Test User",
        email: "test@example.com",
        hashPassword: "hashedPassword",
        role: "customer",
      };

      mockUserFindOne.mockResolvedValue(mockUserData);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue("mockToken123");

      await login(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith("password123", "hashedPassword");
      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          userId: "user123",
          displayName: "Test User",
          role: "customer",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: "mockToken123", refreshToken: "mockToken123" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if user does not exist", async () => {
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      mockUserFindOne.mockResolvedValue(null);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "User does not exist. You must to sign in",
      });
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockJwtSign).not.toHaveBeenCalled();
    });

    it("should return 400 if password is incorrect", async () => {
      req.body = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      const mockUserData = {
        _id: "user123",
        hashPassword: "hashedPassword",
      };

      mockUserFindOne.mockResolvedValue(mockUserData);
      mockBcryptCompare.mockResolvedValue(false);

      await login(req, res, next);

      expect(mockBcryptCompare).toHaveBeenCalledWith("wrongPassword", "hashedPassword");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
      expect(mockJwtSign).not.toHaveBeenCalled();
    });

    it("should call next with error when login fails", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const loginError = new Error("Login failed");
      mockUserFindOne.mockRejectedValue(loginError);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(loginError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("checkEmail", () => {
    it("should return taken: true if email exists", async () => {
      req.query = { email: "existing@example.com" };

      mockUserFindOne.mockResolvedValue({ email: "existing@example.com" });

      await checkEmail(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "existing@example.com",
      });
      expect(res.json).toHaveBeenCalledWith({ taken: true });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return taken: false if email does not exist", async () => {
      req.query = { email: "available@example.com" };

      mockUserFindOne.mockResolvedValue(null);

      await checkEmail(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "available@example.com",
      });
      expect(res.json).toHaveBeenCalledWith({ taken: false });
    });

    it("should handle email with uppercase and spaces", async () => {
      req.query = { email: "  TEST@EXAMPLE.COM  " };

      mockUserFindOne.mockResolvedValue(null);

      await checkEmail(req, res, next);

      expect(mockUserFindOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(res.json).toHaveBeenCalledWith({ taken: false });
    });

    it("should return taken: false if email is empty", async () => {
      req.query = { email: "" };
      mockUserFindOne.mockResolvedValue(null);

      await checkEmail(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ taken: false });
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: "" });
    });

    it("should return taken: false if email query param is missing", async () => {
      req.query = {};
      mockUserFindOne.mockResolvedValue(null);

      await checkEmail(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ taken: false });
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: "" });
    });

    it("should call next with error when database check fails", async () => {
      req.query = { email: "test@example.com" };

      const dbError = new Error("Database error");
      mockUserFindOne.mockRejectedValue(dbError);

      await checkEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
