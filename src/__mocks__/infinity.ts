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
    }
  }),
  createInfinityClient: () => ({
    mute: jest.fn(),
    muteVideo: jest.fn(),
    disconnect: jest.fn(),
    participants: []
  })
}

module.exports = infinityMock
export {}
