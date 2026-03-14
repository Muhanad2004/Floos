// src/constants/categories.js
export const INCOME_CATEGORIES = ['Salary', 'Gift', 'Investment', 'Savings', 'Other']
export const EXPENSE_CATEGORIES = ['Groceries', 'Dining', 'Snacks', 'Bills', 'Laundromat', 'Phone', 'Shopping', 'Health', 'Subscriptions', 'Personal Care', 'Other']

export function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
