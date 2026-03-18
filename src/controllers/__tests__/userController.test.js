import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  changePassword,
  createUser,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUserProfile,
  searchUser,
  toggleUserStatus,
  updateUser,
  updateUserProfile,
} from "../userController.js";

// Usar vi.hoisted para variables que se usan en mocks
const {
  mockUserFindById,
  mockUserFind,
  mockUserFindOne,
  mockUserCountDocuments,
  mockUserSave,
  mockUser,
  mockBcryptHash,
  mockBcryptCompare,
} = vi.hoisted(() => {
  const mockUserFindById = vi.fn();
  const mockUserFind = vi.fn();
  const mockUserFindOne = vi.fn();
  const mockUserCountDocuments = vi.fn();
  const mockUserSave = vi.fn();

  const mockUser = function (data) {
    Object.assign(this, data);
    this.save = mockUserSave;
  };

  const mockBcryptHash = vi.fn();
  const mockBcryptCompare = vi.fn();

  return {
    mockUserFindById,
    mockUserFind,
    mockUserFindOne,
    mockUserCountDocuments,
    mockUserSave,
    mockUser,
    mockBcryptHash,
    mockBcryptCompare,
  };
});

// Configurar mocks
vi.mock("../../models/user.js", () => ({
  default: Object.assign(mockUser, {
    findById: mockUserFindById,
    find: mockUserFind,
    findOne: mockUserFindOne,
    countDocuments: mockUserCountDocuments,
  }),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}));

describe("UserController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Limpiar mocks
    mockUserFindById.mockReset();
    mockUserFind.mockReset();
    mockUserFindOne.mockReset();
    mockUserCountDocuments.mockReset();
    mockUserSave.mockReset();
    mockBcryptHash.mockReset();
    mockBcryptCompare.mockReset();
  });

  describe("getUserProfile", () => {
    it("should return user profile successfully", async () => {
      req.user = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        displayName: "Test User",
        email: "test@example.com",
        role: "customer",
      };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(mockUserData),
      };
      mockUserFindById.mockReturnValue(mockQuery);

      await getUserProfile(req, res, next);

      expect(mockUserFindById).toHaveBeenCalledWith("user123");
      expect(mockQuery.select).toHaveBeenCalledWith("-hashPassword");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User profile retrieved successfully",
        user: mockUserData,
      });
    });

    it("should return 404 if user not found", async () => {
      req.user = { userId: "nonexistent" };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(null),
      };
      mockUserFindById.mockReturnValue(mockQuery);

      await getUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should call next with error when database fails", async () => {
      req.user = { userId: "user123" };

      const dbError = new Error("Database error");
      mockUserFindById.mockReturnValue({
        select: vi.fn().mockRejectedValue(dbError),
      });

      await getUserProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe("getAllUsers", () => {
    it("should return paginated users list", async () => {
      req.query = { page: 1, limit: 10 };

      const mockUsers = [
        { _id: "user1", displayName: "User 1" },
        { _id: "user2", displayName: "User 2" },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockUsers),
      };

      mockUserFind.mockReturnValue(mockQuery);
      mockUserCountDocuments.mockResolvedValue(2);

      await getAllUsers(req, res, next);

      expect(mockUserFind).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Users retrieved successfully",
        users: mockUsers,
        pagination: {
          total: 2,
          totalPages: 1,
          currentPage: 1,
          perPage: 10,
        },
      });
    });

    it("should filter users by role", async () => {
      req.query = { page: 1, limit: 10, role: "admin" };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      };

      mockUserFind.mockReturnValue(mockQuery);
      mockUserCountDocuments.mockResolvedValue(0);

      await getAllUsers(req, res, next);

      expect(mockUserFind).toHaveBeenCalledWith({ role: "admin" });
    });

    it("should filter users by isActive status", async () => {
      req.query = { page: 1, limit: 10, isActive: "true" };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      };

      mockUserFind.mockReturnValue(mockQuery);
      mockUserCountDocuments.mockResolvedValue(0);

      await getAllUsers(req, res, next);

      expect(mockUserFind).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      req.params = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        displayName: "Test User",
        email: "test@example.com",
      };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(mockUserData),
      };
      mockUserFindById.mockReturnValue(mockQuery);

      await getUserById(req, res, next);

      expect(mockUserFindById).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User retrieved successfully",
        user: mockUserData,
      });
    });

    it("should return 404 if user not found", async () => {
      req.params = { userId: "nonexistent" };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(null),
      };
      mockUserFindById.mockReturnValue(mockQuery);

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile successfully", async () => {
      req.user = { userId: "user123" };
      req.body = {
        displayName: "Updated Name",
        phone: "1234567890",
      };

      const mockUserData = {
        _id: "user123",
        displayName: "Old Name",
        email: "test@example.com",
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValueOnce(mockUserData);
      mockUserSave.mockResolvedValue();

      const updatedUser = {
        _id: "user123",
        displayName: "Updated Name",
        email: "test@example.com",
        phone: "1234567890",
      };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(updatedUser),
      };
      mockUserFindById.mockReturnValueOnce(mockQuery);

      await updateUserProfile(req, res, next);

      expect(mockUserData.displayName).toBe("Updated Name");
      expect(mockUserData.phone).toBe("1234567890");
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if user not found", async () => {
      req.user = { userId: "nonexistent" };
      req.body = { displayName: "New Name" };

      mockUserFindById.mockResolvedValue(null);

      await updateUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 400 if email already in use", async () => {
      req.user = { userId: "user123" };
      req.body = { email: "taken@example.com" };

      const mockUserData = {
        _id: "user123",
        email: "old@example.com",
      };

      mockUserFindById.mockResolvedValue(mockUserData);
      mockUserFindOne.mockResolvedValue({ email: "taken@example.com" });

      await updateUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email already in use",
      });
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      req.user = { userId: "user123" };
      req.body = {
        currentPassword: "oldPassword",
        newPassword: "newPassword123",
      };

      const mockUserData = {
        _id: "user123",
        hashPassword: "hashedOldPassword",
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValue(mockUserData);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("hashedNewPassword");
      mockUserSave.mockResolvedValue();

      await changePassword(req, res, next);

      expect(mockBcryptCompare).toHaveBeenCalledWith("oldPassword", "hashedOldPassword");
      expect(mockBcryptHash).toHaveBeenCalledWith("newPassword123", 10);
      expect(mockUserData.hashPassword).toBe("hashedNewPassword");
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if user not found", async () => {
      req.user = { userId: "nonexistent" };
      req.body = {
        currentPassword: "oldPassword",
        newPassword: "newPassword123",
      };

      mockUserFindById.mockResolvedValue(null);

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 400 if current password is incorrect", async () => {
      req.user = { userId: "user123" };
      req.body = {
        currentPassword: "wrongPassword",
        newPassword: "newPassword123",
      };

      const mockUserData = {
        hashPassword: "hashedPassword",
      };

      mockUserFindById.mockResolvedValue(mockUserData);
      mockBcryptCompare.mockResolvedValue(false);

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Current password is incorrect",
      });
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should update user by admin successfully", async () => {
      req.params = { userId: "user123" };
      req.body = {
        displayName: "Admin Updated",
        role: "admin",
        isActive: false,
      };

      const mockUserData = {
        _id: "user123",
        displayName: "Old Name",
        role: "customer",
        isActive: true,
        email: "test@example.com",
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValueOnce(mockUserData);
      mockUserSave.mockResolvedValue();

      const updatedUser = {
        ...mockUserData,
        displayName: "Admin Updated",
        role: "admin",
        isActive: false,
      };
      const mockQuery = {
        select: vi.fn().mockResolvedValue(updatedUser),
      };
      mockUserFindById.mockReturnValueOnce(mockQuery);

      await updateUser(req, res, next);

      expect(mockUserData.displayName).toBe("Admin Updated");
      expect(mockUserData.role).toBe("admin");
      expect(mockUserData.isActive).toBe(false);
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if user not found", async () => {
      req.params = { userId: "nonexistent" };
      req.body = { displayName: "New Name" };

      mockUserFindById.mockResolvedValue(null);

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate user account", async () => {
      req.user = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        isActive: true,
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValue(mockUserData);
      mockUserSave.mockResolvedValue();

      await deactivateUser(req, res, next);

      expect(mockUserData.isActive).toBe(false);
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if user not found", async () => {
      req.user = { userId: "nonexistent" };

      mockUserFindById.mockResolvedValue(null);

      await deactivateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("toggleUserStatus", () => {
    it("should toggle user status from active to inactive", async () => {
      req.params = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        isActive: true,
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValueOnce(mockUserData);
      mockUserSave.mockResolvedValue();

      const updatedUser = { ...mockUserData, isActive: false };
      const mockQuery = {
        select: vi.fn().mockResolvedValue(updatedUser),
      };
      mockUserFindById.mockReturnValueOnce(mockQuery);

      await toggleUserStatus(req, res, next);

      expect(mockUserData.isActive).toBe(false);
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should toggle user status from inactive to active", async () => {
      req.params = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        isActive: false,
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValueOnce(mockUserData);
      mockUserSave.mockResolvedValue();

      const updatedUser = { ...mockUserData, isActive: true };
      const mockQuery = {
        select: vi.fn().mockResolvedValue(updatedUser),
      };
      mockUserFindById.mockReturnValueOnce(mockQuery);

      await toggleUserStatus(req, res, next);

      expect(mockUserData.isActive).toBe(true);
      expect(mockUserSave).toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should soft delete user", async () => {
      req.params = { userId: "user123" };

      const mockUserData = {
        _id: "user123",
        isActive: true,
        save: mockUserSave,
      };

      mockUserFindById.mockResolvedValue(mockUserData);
      mockUserSave.mockResolvedValue();

      await deleteUser(req, res, next);

      expect(mockUserData.isActive).toBe(false);
      expect(mockUserSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if user not found", async () => {
      req.params = { userId: "nonexistent" };

      mockUserFindById.mockResolvedValue(null);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("searchUser", () => {
    it("should search users by query string", async () => {
      req.query = { q: "test", page: 1, limit: 10 };

      const mockUsers = [{ displayName: "Test User 1", email: "test1@example.com" }];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(mockUsers),
      };

      mockUserFind.mockReturnValueOnce(mockQuery);
      mockUserCountDocuments.mockResolvedValue(1);

      await searchUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Users retrieved successfully",
          users: mockUsers,
          pagination: expect.any(Object),
        })
      );
    });

    it("should filter by role", async () => {
      req.query = { role: "admin", page: 1, limit: 10 };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([]),
      };

      mockUserFind.mockReturnValueOnce(mockQuery);
      mockUserCountDocuments.mockResolvedValue(0);

      await searchUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createUser", () => {
    it("should create new user successfully", async () => {
      req.body = {
        displayName: "New User",
        email: "newuser@example.com",
        password: "password123",
        role: "customer",
        phone: "1234567890",
        isActive: true,
      };

      mockBcryptHash.mockResolvedValue("hashedPassword");
      mockUserSave.mockResolvedValue();

      const createdUser = {
        _id: "newuser123",
        displayName: "New User",
        email: "newuser@example.com",
        phone: "1234567890",
        role: "customer",
        isActive: true,
      };

      const mockQuery = {
        select: vi.fn().mockResolvedValue(createdUser),
      };
      mockUserFindById.mockReturnValue(mockQuery);

      await createUser(req, res, next);

      expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User created successfully",
          user: expect.any(Object),
        })
      );
    });

    it("should call next with error when creation fails", async () => {
      req.body = {
        displayName: "New User",
        email: "newuser@example.com",
        password: "password123",
      };

      const saveError = new Error("Save failed");
      mockBcryptHash.mockResolvedValue("hashedPassword");
      mockUserSave.mockRejectedValue(saveError);

      await createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(saveError);
    });
  });
});
