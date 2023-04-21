import './test-params'

const infinityMock = {
  createCallSignals: () => ({
    onRemoteStream: {
      add: jest.fn()
    },
    onRemotePresentationStream: {
      add: jest.fn()
    },
    onPresentationConnectionChange: {
      add: jest.fn()
    }
  }),
  createInfinityClientSignals: () => ({
    onParticipantJoined: {
      add: jest.fn()
    },
    onParticipantLeft: {
      add: jest.fn()
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
    muteVideo: jest.fn(),
    disconnect: jest.fn(),
    participants: []
  })
}

module.exports = infinityMock
export {}
