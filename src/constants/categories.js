// src/constants/categories.js
export const INCOME_CATEGORIES = ['Salary', 'Gift', 'Investment', 'Savings', 'Other']
export const EXPENSE_CATEGORIES = ['Groceries', 'Dining', 'Snacks', 'Bills', 'Laundromat', 'Phone', 'Shopping', 'Health', 'Subscriptions', 'Personal Care', 'Other']

export function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

// Chart colors — keys must match the category strings above
export const EXPENSE_COLORS = {
  Groceries:      '#3ddc68',
  Dining:         '#3B82F6',
  Snacks:         '#F59E0B',
  Bills:          '#EF4444',
  Laundromat:     '#8B5CF6',
  Phone:          '#06B6D4',
  Shopping:       '#EC4899',
  Health:         '#84CC16',
  Subscriptions:  '#F97316',
  'Personal Care':'#6366F1',
  Other:          '#9ca3af',
}

export const INCOME_COLORS = {
  Salary:     '#3ddc68',
  Gift:       '#3B82F6',
  Investment: '#F59E0B',
  Savings:    '#8B5CF6',
  Other:      '#9ca3af',
}
