// src/test/screens/Stats.test.jsx
import { render, screen } from '@testing-library/react'
import Stats from '../../screens/Stats/Stats'

describe('Stats', () => {
  it('renders placeholder text', () => {
    render(<Stats />)
    expect(screen.getByText('Stats coming soon')).toBeInTheDocument()
  })
})
