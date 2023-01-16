import React from 'react'

import { render, screen } from '@testing-library/react'

import App from './App'
import { act } from 'react-dom/test-utils'

// Create a mocks
require('./__mocks__/mediaDevices')
jest.mock('react-i18next', () => {
  return require('./__mocks__/reacti18next')
})

jest.mock('@pexip/media-components', () => {
  return {
    StreamQuality: jest.fn()
  }
})

jest.mock('@pexip/media-processor', () => {}, { virtual: true })

jest.mock('@pexip/infinity', () => {
  return require('./__mocks__/infinity')
}, { virtual: true })

jest.mock('./genesys/genesysService', () => {
  return require('./__mocks__/genesys')
})

jest.mock('./error-panel/ErrorPanel', () => {
  return {
    ErrorPanel: (props: any) => (
      <div data-testid='ErrorPanel'>
        <h3>{props.title}</h3>
        <p>{props.message}</p>
      </div>
    )
  }
})

jest.mock('./toolbar/Toolbar', () => {
  return {
    Toolbar: () => <div data-testid='Toolbar' />
  }
})

jest.mock('./video/Video', () => {
  return {
    Video: () => <div data-testid='Video' />
  }
})

jest.mock('./selfview/Selfview', () => {
  return {
    Selfview: () => <div data-testid='Selfview' />
  }
})

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://myurl/#access_token=secret&state=%7B%22pcEnvironment%22%3A%22usw2.pure.cloud%22%2C%22pcConversationId%22%3A%2262698915-ae56-4efc-b5d7-71d6ad487fae%22%2C%22pexipNode%22%3A%22pexipdemo.com%22%2C%22pexipAgentPin%22%3A%222021%22%7D'
  }
})

describe('App component', () => {
  it('should render', async () => {
    await act(async () => {
      await render(<App />)
    })
    const app = await screen.findByTestId('App')
    expect(app).toBeInTheDocument()
  })

  describe('Error panel', () => {
    it('should display an error if the camera isn\'t connected', async () => {
      await act(async () => {
        (navigator.mediaDevices as any).noEnumerateDevices = true
        await render(<App />);
        (navigator.mediaDevices as any).setEnumerateEmpty = false
      })
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('h3')[0].innerHTML).toBe('Cannot access the camera')
    })
  })
})
