import React from 'react'

import { screen, render } from '@testing-library/react'

import { Effect } from './Effect'

jest.mock('@pexip/components', () => {
  return {
    InteractiveElement: () => {
      return <div />
    },
    Box: () => {
      return <div />
    },
    Text: () => {
      return <div />
    }
  }
})

const handleClick = jest.fn()

describe('SettingsPanel component', () => {
  it('should render', () => {
    render(<Effect
        name='Effect'
        onClick={handleClick}
        active={false} />)
    const effect = screen.getByTestId('Effect')
    expect(effect).toBeInTheDocument()
  })
})
