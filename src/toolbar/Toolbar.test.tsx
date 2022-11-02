import React from 'react'

import { render, screen } from '@testing-library/react'

import { Toolbar } from './Toolbar'
import { InfinityClient } from '@pexip/infinity'

// Create a mock for the ToolbarButton
jest.mock('./ToolbarButton', () => {
  return {
    ToolbarButton: () => {
      return <button />
    }
  }
})

const infinityClientMock: InfinityClient = {
  sendMessage: jest.fn(),
  sendApplicationMessage: jest.fn(),
  participants: [],
  secureCheckCode: '',
  admit: jest.fn(),
  call: jest.fn(),
  disconnect: jest.fn(),
  kick: jest.fn(),
  dial: jest.fn(),
  transfer: jest.fn(),
  mute: jest.fn(),
  muteAllGuests: jest.fn(),
  muteVideo: jest.fn(),
  lock: jest.fn(),
  disconnectAll: jest.fn(),
  setLayout: jest.fn(),
  raiseHand: jest.fn(),
  spotlight: jest.fn(),
  present: jest.fn(),
  restartCall: jest.fn(),
  stopPresenting: jest.fn(),
  setStream: jest.fn(),
  setBandwidth: jest.fn(),
  liveCaptions: jest.fn(),
  setRole: jest.fn(),
  setConferenceExtension: jest.fn(),
  setPin: jest.fn()
}

test('renders the toolbar', () => {
  render(<Toolbar infinityClient={ infinityClientMock }/>)
  const toolbar = screen.getByTestId('Toolbar')
  expect(toolbar).toBeInTheDocument()
})

test('it renders 4 buttons', () => {
  render(<Toolbar infinityClient={ infinityClientMock }/>)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBe(4)
})
