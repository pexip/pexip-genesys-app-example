import { render, screen } from '@testing-library/react'

import { Toolbar } from './Toolbar'
import type { CallSignals, InfinitySignals } from '@pexip/infinity'

jest.mock('../settings-panel/SettingsPanel', () => {
  return {
    SettingsPanel: () => {
      return <div />
    }
  }
})

jest.mock('@pexip/components', () => {
  return {
    Button: (props: any) => {
      const { isActive, ...newProps } = props
      return <button {...newProps} />
    },
    Icon: (props: any) => {
      return <div {...props} />
    },
    notificationToastSignal: {
      add: jest.fn()
    },
    Tooltip: (props: any) => {
      return <div {...props} />
    },
    IconTypes: {
      IconVideoOff: 'IconVideoOff',
      IconVideoOn: 'IconVideoOn',
      IconPresentationOff: 'IconPresentationOff',
      IconPresentationOn: 'IconPresentationOn',
      IconLock: 'IconLock',
      IconUnlock: 'IconUnlock',
      IconOpenInNew: 'IconOpenInNew',
      IconLink: 'IconLink',
      IconInfoRound: 'IconInfoRound',
      IconSettings: 'IconSettings'
    }
  }
})

jest.mock('@pexip/media-components', () => {
  return {
    Stats: () => {
      return <div />
    }
  }
})

jest.mock('@pexip/hooks', () => {
  return require('../__mocks__/hooks')
})

jest.mock('@pexip/signal', () => {
  return require('../__mocks__/signal')
})

jest.mock(
  '@pexip/media-processor',
  () => require('../__mocks__/media-processor'),
  { virtual: true }
)

jest.mock(
  '@pexip/peer-connection-stats',
  () => require('../__mocks__/peer-connection-stats'),
  { virtual: true }
)

jest.mock('@pexip/media', () => {}, { virtual: true })
jest.mock('@pexip/media-control', () => {}, { virtual: true })

const infinityClientMock: any = {
  sendMessage: jest.fn(),
  sendApplicationMessage: jest.fn(),
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
  sendConferenceRequest: jest.fn(),
  conferenceStatus: new Map()
}

const signalMock = {
  size: 0,
  add: jest.fn(),
  addOnce: jest.fn(),
  remove: jest.fn(),
  emit: jest.fn()
}

const callSignalsMock: CallSignals = {
  onRemoteStream: signalMock,
  onRemotePresentationStream: signalMock,
  onCallConnected: signalMock,
  onPresentationConnectionChange: signalMock,
  onRtcStats: signalMock,
  onCallQualityStats: signalMock,
  onCallQuality: signalMock,
  onSecureCheckCode: signalMock,
  onReconnecting: signalMock,
  onReconnected: signalMock
}

const infinitySignalsMock: InfinitySignals = {
  onError: signalMock,
  onPinRequired: signalMock,
  onAnswer: signalMock,
  onApplicationMessage: signalMock,
  onConferenceStatus: signalMock,
  onConnected: signalMock,
  onDisconnected: signalMock,
  onExtension: signalMock,
  onFailedRequest: signalMock,
  onIceCandidate: signalMock,
  onIdp: signalMock,
  onLayoutUpdate: signalMock,
  onLiveCaptions: signalMock,
  onMe: signalMock,
  onMessage: signalMock,
  onMyselfMuted: signalMock,
  onNewOffer: signalMock,
  onParticipantJoined: signalMock,
  onParticipantLeft: signalMock,
  onParticipants: signalMock,
  onPeerDisconnect: signalMock,
  onPresentationAnswer: signalMock,
  onRaiseHand: signalMock,
  onRedirect: signalMock,
  onRequestedLayout: signalMock,
  onRetryQueueFlushed: signalMock,
  onSplashScreen: signalMock,
  onStage: signalMock,
  onTransfer: signalMock,
  onUpdateSdp: signalMock,
  onAuthenticatedWithConference: signalMock,
  onLayoutOverlayTextEnabled: signalMock,
  onServiceType: signalMock,
  onBreakoutEnd: signalMock,
  onBreakoutBegin: signalMock,
  onBreakoutRefer: signalMock,
  onFecc: signalMock,
  onCallDisconnected: signalMock,
  onCancelTransfer: signalMock,
  onTokenRefreshed: signalMock,
  onCallConnected: signalMock,
  onParticipantUpdated: signalMock
}

const handleCameraMuteChanged = jest.fn()
const handlePresentationChanged = jest.fn()
const handleCopyInvitationLink = jest.fn()
const handleSettingsChanged = jest.fn()

test('renders the toolbar', () => {
  render(
    <Toolbar
      infinityClient={infinityClientMock}
      callSignals={callSignalsMock}
      infinitySignals={infinitySignalsMock}
      cameraMuted={true}
      presenting={false}
      onCameraMuteChanged={handleCameraMuteChanged}
      onPresentationChanged={handlePresentationChanged}
      onCopyInvitationLink={handleCopyInvitationLink}
      onSettingsChanged={handleSettingsChanged}
    />
  )
  const toolbar = screen.getByTestId('Toolbar')
  expect(toolbar).toBeInTheDocument()
})

test('it renders 7 buttons', () => {
  render(
    <Toolbar
      infinityClient={infinityClientMock}
      callSignals={callSignalsMock}
      infinitySignals={infinitySignalsMock}
      cameraMuted={true}
      presenting={false}
      onCameraMuteChanged={handleCameraMuteChanged}
      onPresentationChanged={handlePresentationChanged}
      onCopyInvitationLink={handleCopyInvitationLink}
      onSettingsChanged={handleSettingsChanged}
    />
  )
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBe(7)
})
