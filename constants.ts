import { Transaction, Category, TransactionType } from './types';

export const EXPENSE_CATEGORIES: Category[] = [
  Category.FOOD,
  Category.TRAVEL,
  Category.SHOPPING,
  Category.UTILITIES,
  Category.ENTERTAINMENT,
  Category.HEALTH,
  Category.OTHER,
];

export const INCOME_CATEGORIES: Category[] = [
  Category.SALARY,
  Category.FREELANCE,
  Category.INVESTMENTS,
  Category.OTHER,
];

export const generateInitialTransactions = (): Transaction[] => {
  // Return an empty array to start with a blank state.
  return [];
};
