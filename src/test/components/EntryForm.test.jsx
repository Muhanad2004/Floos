// src/test/components/EntryForm.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../context/AppContext'
import EntryForm from '../../components/EntryForm/EntryForm'

const noop = () => {}

function renderForm(props = {}) {
  return render(
    <AppProvider>
      <EntryForm onSubmit={noop} {...props} />
    </AppProvider>
  )
}

describe('EntryForm', () => {
  it('shows expense categories in BottomSheet by default', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByText('Category'))
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('shows income categories after switching to income mode', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByText('Expense'))
    await user.click(screen.getByText('Category'))
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('does not call onSubmit when confirm is tapped with no category', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })
    await user.click(screen.getByText('1'))
    // confirm button is disabled (no category selected) — querying the disabled button specifically
    const confirmBtn = screen.getAllByRole('button').find(b => b.disabled)
    expect(confirmBtn).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
