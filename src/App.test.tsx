import React, { PropsWithChildren } from 'react'

import { render, screen } from '@testing-library/react'

import App from './App'

// Create a mocks
jest.mock('./toolbar/Toolbar', () => {
  return {
    Toolbar: () => {
      return <div data-testid='Toolbar' />
    }
  }
})

jest.mock('react-draggable', () => {
  return {
    Draggable: (props: PropsWithChildren) => {
      return <div data-testid='Draggable'>{props.children}</div>
    }
  }
})

jest.mock('./video/Video', () => {
  return {
    Video: () => {
      return <div data-testid='Video' />
    }
  }
})

beforeAll(() => {
  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
    // Add any method you want to mock
  }))
})

beforeEach(() => {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: jest.fn(() => new Promise<void>(resolve => resolve())),
    }
  })
})

test('renders app', async () => {
  render(<App />)
  const app = await screen.findByTestId('App')
  expect(app).toBeInTheDocument()
})
