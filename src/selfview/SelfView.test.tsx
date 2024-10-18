import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { type CallSignals } from '@pexip/infinity'

import { SelfView } from './SelfView'

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
  onReconnecting: {
    add: jest.fn(),
    size: 0,
    addOnce: jest.fn(),
    remove: jest.fn(),
    emit: jest.fn()
  },
  onReconnected: {
    add: jest.fn(),
    size: 0,
    addOnce: jest.fn(),
    remove: jest.fn(),
    emit: jest.fn()
  }
}

jest.mock('@pexip/media-components', () => {
  return {
    DraggableFoldableInMeetingSelfview: (_props: any) => {
      return <div />
    },
    useCallQuality: jest.fn(),
    useNetworkState: jest.fn()
  }
})

jest.mock(
  '@pexip/infinity',
  () => {
    return {
      callLivenessSignals: jest.fn()
    }
  },
  { virtual: true }
)

beforeAll(() => {
  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
  }))
})

describe('SelfView component', () => {
  it('should render', () => {
    render(
      <SelfView
        floatRoot={createRef()}
        callSignals={callSignalsMock}
        username={'Agent'}
        localStream={new MediaStream()}
        onCameraMuteChanged={jest.fn()}
      />
    )
    const selfView = screen.getByTestId('SelfView')
    expect(selfView).toBeInTheDocument()
  })
})
