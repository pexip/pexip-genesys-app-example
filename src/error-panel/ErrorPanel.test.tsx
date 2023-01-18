import React from 'react'

import { screen, render } from '@testing-library/react'

import { ErrorPanel } from './ErrorPanel'

jest.mock('@pexip/components', () => {
  return require('../__mocks__/components')
})

jest.mock('react-i18next', () => {
  return require('../__mocks__/reacti18next')
})

const errorId = 'errors.camera-not-connected'

describe('ErrorPanel component', () => {
  const handleClick = jest.fn()

  beforeEach(() => {
    handleClick.mockReset()
  })

  it('should render', () => {
    render(<ErrorPanel
      errorId={errorId}
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel).toBeInTheDocument()
  })

  it('should display the title', () => {
    render(<ErrorPanel
      errorId={errorId}
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('h3')[0].innerHTML).toBe(`${errorId}.title`)
  })

  it('should display the message content', () => {
    render(<ErrorPanel
      errorId={errorId}
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(`${errorId}.message`)
  })

  it('should trigger "onClick" when the "try again" button is pressed', () => {
    render(<ErrorPanel
      errorId={errorId}
      onClick={handleClick}
    />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    errorPanel.getElementsByTagName('button')[0].click()
    expect(handleClick).toBeCalledTimes(1)
  })
})
