import { Category, TransactionType } from '../types';

export type CategoryPreferences = Record<TransactionType, string[]>;

const DEFAULT_CATEGORIES: CategoryPreferences = {
  [TransactionType.EXPENSE]: [
    Category.FOOD,
    Category.TRAVEL,
    Category.SHOPPING,
    Category.UTILITIES,
    Category.ENTERTAINMENT,
    Category.HEALTH,
    Category.RENT,
    Category.BILLS,
    Category.EDUCATION,
    Category.OTHER,
  ],
  [TransactionType.INCOME]: [
    Category.SALARY,
    Category.FREELANCE,
    Category.INVESTMENTS,
    Category.OTHER,
  ],
};

const getStorageKey = (userId: string) => `finsight_${userId}_categories`;

const copyDefaults = (): CategoryPreferences => ({
  [TransactionType.EXPENSE]: [...DEFAULT_CATEGORIES[TransactionType.EXPENSE]],
  [TransactionType.INCOME]: [...DEFAULT_CATEGORIES[TransactionType.INCOME]],
});

export const loadCategoryPreferences = (userId: string): CategoryPreferences => {
  try {
    const saved = localStorage.getItem(getStorageKey(userId));
    if (!saved) return copyDefaults();

    const parsed = JSON.parse(saved) as Partial<CategoryPreferences>;
    const preferences = copyDefaults();

    Object.values(TransactionType).forEach((type) => {
      const categories = parsed[type];
      if (Array.isArray(categories) && categories.length > 0) {
        preferences[type] = categories.filter(
          (category): category is string => typeof category === 'string' && category.trim().length > 0,
        );
      }
    });

    return preferences;
  } catch {
    return copyDefaults();
  }
};

export const saveCategoryPreferences = (
  userId: string,
  preferences: CategoryPreferences,
): void => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(preferences));
};
