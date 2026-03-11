// src/constants/categories.js
export const INCOME_CATEGORIES = ['Salary', 'Gift', 'Savings', 'Family', 'Other']
export const EXPENSE_CATEGORIES = ['Fuel', 'Groceries', 'Snacks', 'Bills', 'Other']

export function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
