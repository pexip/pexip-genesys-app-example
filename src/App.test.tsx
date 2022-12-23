import React from 'react'

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

jest.mock('./video/Video', () => {
  return {
    Video: () => {
      return <div data-testid='Video' />
    }
  }
})

jest.mock('./selfview/Selfview', () => {
  return {
    Selfview: () => {
      return <div data-testid='Selfview' />
    }
  }
})

jest.mock('@pexip/media-components', () => {
  return {
    StreamQuality: jest.fn()
  }
})

jest.mock('@pexip/infinity', () => {}, { virtual: true })

beforeAll(() => {
  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
    // Add any method you want to mock
  }))
})

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://myurl/#access_token=secret&state=%7B%22pcEnvironment%22%3A%22usw2.pure.cloud%22%2C%22pcConversationId%22%3A%2262698915-ae56-4efc-b5d7-71d6ad487fae%22%2C%22pexipNode%22%3A%22pexipdemo.com%22%2C%22pexipAgentPin%22%3A%222021%22%7D'
  }
})

test('renders app', async () => {
  await render(<App />)
  const app = await screen.findByTestId('App')
  expect(app).toBeInTheDocument()
})
