// src/test/components/EntryForm.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryForm from '../../components/EntryForm/EntryForm'

const noop = () => {}

describe('EntryForm', () => {
  it('shows income categories by default', () => {
    render(<EntryForm onSubmit={noop} />)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Fuel')).not.toBeInTheDocument()
  })

  it('shows expense categories when mode is switched to expense', async () => {
    const user = userEvent.setup()
    render(<EntryForm onSubmit={noop} />)
    await user.click(screen.getByText('Expense'))
    expect(screen.getByText('Fuel')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('does not call onSubmit when confirm is tapped with no category', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EntryForm onSubmit={onSubmit} />)
    await user.click(screen.getByText('1'))
    await user.click(screen.getByText('✓'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
