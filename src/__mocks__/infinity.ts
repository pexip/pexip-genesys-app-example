import './test-params'

export enum ClientCallType {
  Audio = 'audio',
  Video = 'video',
  None = 'none'
}

export enum CallType {
  audio = 'audio',
  video = 'video',
  api = 'api'
}

let mockParticipants: any[] = []
let participantLeftCallback: () => void

export const createCallSignals = (): unknown => ({
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
})
export const createInfinityClientSignals = (): unknown => ({
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
})
export const createInfinityClient = (): unknown => ({
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
  disconnect: mockDisconnect,
  disconnectAll: mockDisconnectAll,
  getParticipants: jest.fn(() => mockParticipants)
})
export const setMockParticipants = (participants: any[]): void => {
  mockParticipants = participants
}
export const mockDisconnect = jest.fn()
export const mockDisconnectAll = jest.fn()
export const triggerParticipantLeft = (): void => {
  participantLeftCallback()
}
