import './test-params'

enum ClientCallType {
  Audio = 'audio',
  Video = 'video',
  None = 'none'
}

enum CallType {
  audio = 'audio',
  video = 'video',
  api = 'api'
}

let mockParticipants: any[] = []
let participantLeftCallback: () => void

const infinityMock = {
  createCallSignals: () => ({
    onRemoteStream: {
      add: jest.fn(),
      remove: jest.fn()
    },
    onRemotePresentationStream: {
      add: jest.fn(),
      remove: jest.fn()
    },
    onPresentationConnectionChange: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }),
  createInfinityClientSignals: () => ({
    onParticipantJoined: {
      add: jest.fn(),
      remove: jest.fn()
    },
    onParticipantLeft: {
      add: (callback: () => void) => {
        participantLeftCallback = callback
      },
      remove: jest.fn()
    }
  }),
  createInfinityClient: () => ({
    call: () => {
      if ((window as any).testParams.infinityUnavailable === true) {
        return undefined
      }
      if ((window as any).testParams.conferenceNotFound === true) {
        return {
          status: 404,
          data: {
            status: 'failed',
            result: 'Neither conference nor gateway found'
          }
        }
      }
      if ((window as any).testParams.conferenceWrongPIN === true) {
        return {
          status: 403,
          data: {
            status: 'failed',
            result: 'Invalid PIN'
          }
        }
      }
      return {
        status: 200,
        data: {
          status: 'success',
          result: {
            token: '1234'
          }
        }
      }
    },
    mute: jest.fn(),
    muteVideo: jest.fn().mockResolvedValue(null),
    disconnect: infinityMock.mockDisconnect,
    disconnectAll: infinityMock.mockDisconnectAll,
    getParticipants: jest.fn(() => mockParticipants)
  }),
  ClientCallType,
  CallType,
  setMockParticipants: (participants: any[]) => {
    mockParticipants = participants
  },
  mockDisconnect: jest.fn(),
  mockDisconnectAll: jest.fn(),
  triggerParticipantLeft: () => {
    participantLeftCallback()
  }
}

module.exports = infinityMock
export {}
