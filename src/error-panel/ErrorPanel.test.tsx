import { screen, render } from '@testing-library/react'

import { ErrorPanel } from './ErrorPanel'
import { ErrorId } from '../constants/ErrorId'

jest.mock('@pexip/components', () => {
  return require('../__mocks__/components')
})

const error = ErrorId.CAMERA_NOT_CONNECTED

describe('ErrorPanel component', () => {
  const handleClick = jest.fn()

  beforeEach(() => {
    handleClick.mockReset()
  })

  it('should render', () => {
    render(<ErrorPanel error={error} onClick={handleClick} />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel).toBeInTheDocument()
  })

  it('should display the title', () => {
    render(<ErrorPanel error={error} onClick={handleClick} />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('h3')[0].innerHTML).toBe(
      'Cannot connect'
    )
  })

  it('should display the message content', () => {
    render(<ErrorPanel error={error} onClick={handleClick} />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(error)
  })

  it('should trigger "onClick" when the "try again" button is pressed', () => {
    render(<ErrorPanel error={error} onClick={handleClick} />)
    const errorPanel = screen.getByTestId('ErrorPanel')
    errorPanel.getElementsByTagName('button')[0].click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
