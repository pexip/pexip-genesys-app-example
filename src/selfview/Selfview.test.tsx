import React, { createRef } from 'react'

import { render, screen } from '@testing-library/react'
import { CallSignals } from '@pexip/infinity'

import Selfview from './Selfview'

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
  onSecureCheckCode: signalMock
}

// jest.mock('react-draggable', () => {
//   const draggableMock = (props: PropsWithChildren): JSX.Element => <div data-testid='Draggable'>{props.children}</div>
//   draggableMock.displayName = 'Draggable'
//   return draggableMock
// })

jest.mock('@pexip/media-components', () => {
  return {
    DraggableFoldableInMeetingSelfview: (props: any) => {
      return <div />
    },
    useCallQuality: jest.fn(),
    useNetworkState: jest.fn()
  }
})

jest.mock('@pexip/infinity', () => {
  return {
    callLivenessSignals: jest.fn()
  }
}, { virtual: true })

beforeAll(() => {
  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
  }))
})

describe('Selfview component', () => {
  it('should render', () => {
    render(<Selfview
      floatRoot={createRef()}
      callSignals={callSignalsMock}
      username={ 'Agent' }
      localStream={new MediaStream()}
    />)
    const selfview = screen.getByTestId('Selfview')
    expect(selfview).toBeInTheDocument()
  })
})
