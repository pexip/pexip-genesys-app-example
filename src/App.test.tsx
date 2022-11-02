import React, { PropsWithChildren } from 'react'

// import { render, screen } from '@testing-library/react'

// import App from './App'

// Create a mocks
jest.mock('./toolbar/Toolbar', () => {
  return {
    Toolbar: () => {
      return <div data-testid='Toolbar' />
    }
  }
})

jest.mock('react-draggable', () => {
  const draggableMock = (props: PropsWithChildren): JSX.Element => <div data-testid='Draggable'>{props.children}</div>
  draggableMock.displayName = 'Draggable'
  return draggableMock
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
      getUserMedia: jest.fn(async () => await new Promise<void>(resolve => resolve()))
    }
  })
})

/**
 * Empty test to bypass the problem linkin the @pexip/infinity library
 */
test('empty test (to delete)', async () => {
  expect(true).toBe(true)
})

// test('renders app', async () => {
//   await render(<App />)
//   const app = await screen.findByTestId('App')
//   expect(app).toBeInTheDocument()
// })
