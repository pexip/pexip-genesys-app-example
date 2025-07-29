import './__mocks__/test-params'

import { act, render, screen } from '@testing-library/react'

import { App } from './App'
import { ErrorId } from './constants/ErrorId'

// eslint-disable-next-line no-var
var setMockParticipants: (participants: any[]) => void
// eslint-disable-next-line no-var
var mockDisconnect: jest.Mock
// eslint-disable-next-line no-var
var mockDisconnectAll: jest.Mock
// eslint-disable-next-line no-var
var triggerParticipantLeft: () => void

// Create a mocks
require('./__mocks__/mediaDevices')

jest.mock('@pexip/components', () => require('./__mocks__/components'))

jest.mock('@pexip/media-components', () => {
  return {
    StreamQuality: jest.fn()
  }
})

jest.mock(
  '@pexip/media-processor',
  () => require('./__mocks__/media-processor'),
  { virtual: true }
)

jest.mock(
  '@pexip/infinity',
  () => {
    const mockInfinity = { ...require('./__mocks__/infinity') }
    setMockParticipants = mockInfinity.setMockParticipants
    mockDisconnect = mockInfinity.mockDisconnect
    mockDisconnectAll = mockInfinity.mockDisconnectAll
    triggerParticipantLeft = mockInfinity.triggerParticipantLeft
    return mockInfinity
  },
  { virtual: true }
)

const mockGenesysServiceInitialize = jest.fn()
jest.mock('./genesys/genesysService', () => ({
  ...require('./__mocks__/genesys-service'),
  initialize: () => {
    mockGenesysServiceInitialize()
  }
}))

jest.mock('./error-panel/ErrorPanel', () => {
  return {
    ErrorPanel: (props: any) => {
      return (
        <div data-testid="ErrorPanel" className="ErrorPanel">
          <h3>Cannot connect</h3>
          <p>{props.error}</p>
        </div>
      )
    }
  }
})

jest.mock('./toolbar/Toolbar', () => {
  return require('./__mocks__/toolbar')
})

jest.mock('./selfview/SelfView', () => {
  return {
    SelfView: () => <div data-testid="SelfView" />
  }
})

const propertyDescriptors = Object.getOwnPropertyDescriptors(window)

for (const key in propertyDescriptors) {
  propertyDescriptors[key].configurable = true
}

const clonedWindow = Object.defineProperties({}, propertyDescriptors)
Object.defineProperty(clonedWindow, 'location', {
  value: {
    href: 'https://myurl/#access_token=secret&state=%7B%22pcEnvironment%22%3A%22usw2.pure.cloud%22%2C%22pcConversationId%22%3A%2262698915-ae56-4efc-b5d7-71d6ad487fae%22%2C%22pexipNode%22%3A%22pexipdemo.com%22%2C%22pexipAgentPin%22%3A%222021%22%7D'
  }
})

const participantSipTrunk = {
  uuid: '1',
  callType: 'audio',
  role: 'chair',
  displayName: 'sipTrunk'
}

const participantCustomer = {
  uuid: '2',
  callType: 'video',
  role: 'guest',
  displayName: 'customer'
}

const participantAgentApi = {
  uuid: '3',
  callType: 'api',
  role: 'chair',
  displayName: 'agent'
}

const participantAgentVideo = {
  uuid: '4',
  callType: 'video',
  role: 'chair',
  displayName: 'agent'
}

describe('App component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render', async () => {
    render(<App />)
    const app = await screen.findByTestId('App')
    expect(app).toBeInTheDocument()
  })

  describe('Error panel', () => {
    beforeEach(() => {
      ;(window as any).testParams.enumerateDevicesEmpty = false
      ;(window as any).testParams.rejectGetUserMedia = false
      ;(window as any).testParams.infinityUnavailable = false
      ;(window as any).testParams.conferenceNotFound = false
      ;(window as any).testParams.conferenceWrongPIN = false
    })

    it("shouldn't display the panel if there isn't an error", async () => {
      render(<App />)
      const app = await screen.findByTestId('App')
      expect(app.getElementsByClassName('ErrorPanel').length).toBe(0)
    })

    it("should display an error if the camera isn't connected", async () => {
      ;(window as any).testParams.enumerateDevicesEmpty = true
      ;(window as any).testParams.rejectGetUserMedia = true
      render(<App />)
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(
        ErrorId.CAMERA_NOT_CONNECTED
      )
    })

    it("should display an error if the user didn't grant camera permission", async () => {
      ;(window as any).testParams.rejectGetUserMedia = true
      render(<App />)
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(
        ErrorId.CAMERA_ACCESS_DENIED
      )
    })

    it('should display an error if there is not a connection with the Infinity server', async () => {
      ;(window as any).testParams.infinityUnavailable = true
      render(<App />)
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(
        ErrorId.INFINITY_SERVER_UNAVAILABLE
      )
    })

    it('should display an error if the conference cannot be found', async () => {
      ;(window as any).testParams.conferenceNotFound = true
      render(<App />)
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(
        ErrorId.CONFERENCE_NOT_FOUND
      )
    })

    it('should display an error if the conference PIN is wrong', async () => {
      ;(window as any).testParams.conferenceWrongPIN = true
      render(<App />)
      const errorPanel = await screen.findByTestId('ErrorPanel')
      expect(errorPanel.getElementsByTagName('p')[0].innerHTML).toBe(
        ErrorId.CONFERENCE_AUTHENTICATION_FAILED
      )
    })
  })

  describe('Genesys service', () => {
    it('should call to initialize once', async () => {
      await act(async () => {
        render(<App />)
      })
      expect(mockGenesysServiceInitialize).toHaveBeenCalledTimes(1)
    })
  })

  describe('Agent disconnect behavior', () => {
    beforeEach(() => {
      setMockParticipants([])
    })

    it("should stay when participants >= 1 with callType == api or video (agent.callType == 'api')", async () => {
      setMockParticipants([
        participantSipTrunk,
        participantCustomer,
        participantAgentApi
      ])
      await act(async () => {
        render(<App />)
      })
      triggerParticipantLeft()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockDisconnectAll).not.toHaveBeenCalled()
    })

    it("should stay when participants >= 1 with callType == api or video (agent.callType == 'video')", async () => {
      setMockParticipants([
        participantSipTrunk,
        participantCustomer,
        participantAgentVideo
      ])
      await act(async () => {
        render(<App />)
      })
      triggerParticipantLeft()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockDisconnectAll).not.toHaveBeenCalled()
    })

    it("should leave when callType == api and it's only one with callType == api or video", async () => {
      setMockParticipants([participantSipTrunk, participantAgentApi])
      await act(async () => {
        render(<App />)
      })
      triggerParticipantLeft()
      const noActiveCallPanel = await screen.findAllByTestId('no-active-call')
      expect(noActiveCallPanel.length).toBe(1)
      expect(mockDisconnect).toHaveBeenCalledTimes(1)
      expect(mockDisconnectAll).toHaveBeenCalledTimes(1)
    })

    it("should leave when callType == video and it's only one with callType == api or video", async () => {
      setMockParticipants([participantSipTrunk, participantAgentVideo])
      await act(async () => {
        render(<App />)
      })
      triggerParticipantLeft()
      const noActiveCallPanel = await screen.findAllByTestId('no-active-call')
      expect(noActiveCallPanel.length).toBe(1)
      expect(mockDisconnect).toHaveBeenCalledTimes(1)
      expect(mockDisconnectAll).toHaveBeenCalledTimes(1)
    })
  })
})
