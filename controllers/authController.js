//auth.controller.js
import { PrismaClient } from '@prisma/client';
import createError from '../utils/createError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req, res, next) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 5);
    const newUser = await prisma.user.create({
      data: {
        ...req.body,
        password: hash,
      },
    });

    // Generate token similar to login
    const token = jwt.sign(
      {
        id: newUser.id,
        isSeller: newUser.isSeller,
      },
      process.env.JWT_KEY,
      { expiresIn: "7d" }
    );

    const { password, ...info } = newUser;

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(201)
      .json({
        token,
        user: info,
      });
  } catch (err) {
    if (err.code === 'P2002') {
      return next(createError(400, "Username already exists!"));
    }
    else if (err.code === 'P2003') {
      return next(createError(400, "Email already exists!"));
    }
    else if (err.code === 'P2004') {
      return next(createError(400, "Phone number already exists!"));
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.body.username },
    });

    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isCorrect)
      return next(createError(400, "Wrong password or username!"));

    const token = jwt.sign(
      {
        id: user.id,
        isSeller: user.isSeller,
      },
      process.env.JWT_KEY,
      { expiresIn: "7d" } // ✅ Set token expiration
    );

    const { password, ...info } = user;

    res
      .cookie("accessToken", token, {
        httpOnly: true, // ✅ Prevent XSS attacks
        secure: process.env.NODE_ENV === "production", // ✅ Secure in production
        sameSite: "strict",
      })
      .status(200)
      .json({
        token, // ✅ Return the token in response body
        user: info,
      });
  } catch (err) {
    next(err);
  }
};


export const logout = async (req, res) => {
  res
    .clearCookie('accessToken', {
      sameSite: 'none',
      secure: true,
    })
    .status(200)
    .send('User has been logged out.');
};