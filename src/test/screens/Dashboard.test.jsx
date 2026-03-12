// src/test/screens/Dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import Dashboard from '../../screens/Dashboard/Dashboard'
import { AppContext } from '../../context/AppContext'

function renderWithContext(transactions) {
  const ctx = {
    transactions,
    settings: { theme: 'system' },
    addTransaction: () => {},
    updateTransaction: () => {},
    deleteTransaction: () => {},
    updateSettings: () => {},
    eraseAllData: () => {},
  }
  return render(
    <AppContext.Provider value={ctx}>
      <Dashboard />
    </AppContext.Provider>
  )
}

describe('Dashboard', () => {
  it('shows 0.000 with no transactions', () => {
    renderWithContext([])
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByTestId('balance-amount').textContent).toBe('0.000')
  })

  it('shows correct all-time balance', () => {
    renderWithContext([
      { id: '1', type: 'income', amount: 100, category: 'Salary', createdAt: new Date().toISOString() },
      { id: '2', type: 'expense', amount: 30, category: 'Fuel', createdAt: new Date().toISOString() },
    ])
    expect(screen.getByTestId('balance-amount').textContent).toBe('70.000')
  })
})
