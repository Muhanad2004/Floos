// src/test/screens/Stats.test.jsx
import { render, screen } from '@testing-library/react'
import { AppProvider } from '../../context/AppContext'
import Stats from '../../screens/Stats/Stats'

function renderStats() {
  return render(
    <AppProvider>
      <Stats />
    </AppProvider>
  )
}

describe('Stats', () => {
  it('renders empty state messages when no transactions exist', () => {
    renderStats()
    expect(screen.getByText('No expenses recorded')).toBeInTheDocument()
    expect(screen.getByText('No income recorded')).toBeInTheDocument()
  })
})
