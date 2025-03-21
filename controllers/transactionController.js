// transaction.controller.js
import { PrismaClient } from '@prisma/client';
import createError from '../utils/createError.js';

const prisma = new PrismaClient();

export const createTransaction = async (req, res, next) => {
  const { type, amount, description } = req.body;
  
  // Validate required fields
  if (!type || amount === undefined) {
    return next(createError(400, 'Missing required fields: type and amount'));
  }
  
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        type,
        amount: parseFloat(amount),
        description: description || '',
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    next(createError(500, 'Failed to create transaction', { details: error.message }));
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(transactions);
  } catch (error) {
    next(createError(500, 'Failed to fetch transactions', { details: error.message }));
  }
};

export const getTransactionById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) return next(createError(404, 'Transaction not found'));
    if (transaction.userId !== req.userId)
      return next(createError(403, 'You are not authorized to view this transaction'));
    res.status(200).json(transaction);
  } catch (error) {
    next(createError(500, 'Failed to fetch transaction', { details: error.message }));
  }
};

export const deleteTransaction = async (req, res, next) => {
  const { id } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) return next(createError(404, 'Transaction not found'));
    if (transaction.userId !== req.userId)
      return next(createError(403, 'You are not authorized to delete this transaction'));

    await prisma.transaction.delete({
      where: { id },
    });
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(createError(500, 'Failed to delete transaction', { details: error.message }));
  }
};
