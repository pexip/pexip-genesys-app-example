import React from 'react'

import { screen, render } from '@testing-library/react'

import { ErrorPanel } from './ErrorPanel'

jest.mock('@pexip/components', () => {
  return require('../__mocks__/components')
})

describe('ErrorPanel component', () => {
  const handleClick = jest.fn()

  beforeEach(() => {
    handleClick.mockReset()
  })

  it('should render', () => {
    render(<ErrorPanel
      title='Title'
      message='Content'
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel).toBeInTheDocument()
  })

  it('should display the title', () => {
    render(<ErrorPanel
      title='Title'
      message='Content'
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('h3')[0].innerHTML).toBe('Title')
  })

  it('should display the message content', () => {
    render(<ErrorPanel
      title='Title'
      message='Content'
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe('Content')
  })

  it('should trigger "onClick" when the "try again" button is pressed', () => {
    render(<ErrorPanel
      title='Title'
      message='Content'
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    errorPanel.getElementsByTagName('button')[0].click()
    expect(handleClick).toBeCalledTimes(1)
  })
})
