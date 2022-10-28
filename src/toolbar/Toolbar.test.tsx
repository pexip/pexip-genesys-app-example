import React from 'react'

import { render, screen } from '@testing-library/react'

import { Toolbar } from './Toolbar'

// Create a mock for the ToolbarButton
jest.mock('./ToolbarButton', () => {
  return {
    ToolbarButton: () => {
      return <button />
    }
  }
})

test('renders the toolbar', () => {
  render(<Toolbar />)
  const toolbar = screen.getByTestId('Toolbar')
  expect(toolbar).toBeInTheDocument()
})

test('it renders 4 buttons', () => {
  render(<Toolbar />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBe(4)
})
