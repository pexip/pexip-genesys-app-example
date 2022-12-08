import React from 'react'

import { render, screen } from '@testing-library/react'

import { Toolbar } from './Toolbar'
import { CallSignals, InfinityClient } from '@pexip/infinity'
import { InfinityContext } from '../App'

// Create a mock for the ToolbarButton
jest.mock('./toolbar-button/ToolbarButton', () => {
  return {
    ToolbarButton: () => {
      return <button />
    }
  }
})

jest.mock('./settings-panel/SettingsPanel', () => {
  return {
    SettingsPanel: () => {
      return <div />
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
  setTextOverlay: jest.fn(),
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
  setPin: jest.fn(),
  dtmf: jest.fn()
}

const signalMock = {
  size: 0,
  add: jest.fn(),
  addOnce: jest.fn(),
  remove: jest.fn(),
  emit: jest.fn()
}

const infinityContextMock: InfinityContext = {
  conferenceAlias: 'Mock_Alias',
  conferencePin: '1234',
  infinityHost: 'Host'
}

const callSignalsMock: CallSignals = {
  onRemoteStream: signalMock,
  onRemotePresentationStream: signalMock,
  onCallConnected: signalMock,
  onPresentationConnectionChange: signalMock,
  onRtcStats: signalMock,
  onCallQualityStats: signalMock,
  onCallQuality: signalMock,
  onSecureCheckCode: signalMock
}

const handleLocalPresentationStream = jest.fn()
const handleLocalStream = jest.fn()

test('renders the toolbar', () => {
  render(<Toolbar infinityClient={ infinityClientMock } infinityContext={infinityContextMock} callSignals={ callSignalsMock }
    onLocalPresentationStream={handleLocalPresentationStream} onLocalStream={handleLocalStream} />)
  const toolbar = screen.getByTestId('Toolbar')
  expect(toolbar).toBeInTheDocument()
})

test('it renders 5 buttons', () => {
  render(<Toolbar infinityClient={ infinityClientMock } infinityContext={infinityContextMock} callSignals={ callSignalsMock }
    onLocalPresentationStream={handleLocalPresentationStream} onLocalStream={handleLocalStream} />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBe(5)
})
