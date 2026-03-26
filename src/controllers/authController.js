// @ts-check
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * @param {any} userId
 * @param {any} displayName
 * @param {any} role
 */
const generateToken = (userId, displayName, role) => {
  const secret = process.env.JWT_SECRET || "default_secret_fallback";
  return jwt.sign({ userId, displayName, role }, secret, {
    expiresIn: "4h",
  });
};

/**
 * @param {any} userId
 * @param {any} displayName
 * @param {any} role
 */
const generateRefreshToken = (userId, displayName, role) => {
  const secret = process.env.REFRESH_TOKEN_SECRET || "default_refresh_fallback";
  return jwt.sign(
    { userId, displayName, role },
    secret,
    {
      expiresIn: "7d",
    },
  );
};

/**
 * @param {string} password
 */
const generatePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * @param {string} email
 */
const checkUserExist = async (email) => {
  const user = await User.findOne({ email });
  return user;
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function register(req, res, next) {
  try {
    const { displayName, email, password, phone, avatar, role } = req.body;

    const userExist = await checkUserExist(email);
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Por defecto el rol es customer, a menos que se especifique uno válido
    const finalRole = ["admin", "customer"].includes(role) ? role : "customer";

    const hashPassword = await generatePassword(password);

    const newUser = new User({
      displayName,
      email,
      hashPassword,
      role: finalRole,
      phone,
      avatar: avatar || "https://placehold.co/100x100.png"
    });

    await newUser.save();

    // Devolvemos el usuario creado sin la contraseña
    res.status(201).json({
      _id: newUser._id,
      displayName: newUser.displayName,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      phone: newUser.phone
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const userExist = await checkUserExist(email);
    if (!userExist) {
      return res
        .status(400)
        .json({ message: "User does not exist. You must to sign in" });
    }
    const isMatch = await bcrypt.compare(password, userExist.hashPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = generateToken(
      userExist._id,
      userExist.displayName,
      userExist.role,
    );
    const refreshToken = generateRefreshToken(
      userExist._id,
      userExist.displayName,
      userExist.role,
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function checkEmail(req, res, next) {
  try {
    // @ts-ignore
    const page = parseInt(String(req.query.page || 1));
    // @ts-ignore
    const limit = parseInt(String(req.query.limit || 10));
    const skip = (page - 1) * limit;
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email });
    res.json({ taken: !!user });
  } catch (err) {
    next(err);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token)
      return res.status(401).json({ message: "No refresh token provided" });

      // @ts-ignore
      const secret = process.env.REFRESH_TOKEN_SECRET || "";
      // @ts-ignore
      jwt.verify(token, secret, (/** @type {any} */ err, /** @type {any} */ decoded) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

      const newAccessToken = generateToken(
        decoded.userId,
        decoded.displayName,
        decoded.role,
      );

      const newRefreshToken = generateRefreshToken(
        decoded.userId,
        decoded.displayName,
        decoded.role,
      );

      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 4 * 60 * 60 * 1000 // 4 hours
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res
        .status(200)
        .json({ token: newAccessToken });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function logout(req, res, next) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export { checkEmail, login, register, refreshToken, logout };
