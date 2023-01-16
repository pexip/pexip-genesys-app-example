const genesysMock = {
  initialize: async () => await Promise.resolve(),
  isCallActive: () => true,
  addMuteListener: jest.fn(),
  addHoldListener: jest.fn(),
  addEndCallListener: jest.fn(),
  fetchAniName: jest.fn(),
  fetchAgentName: jest.fn(),
  isHold: jest.fn(),
  isMuted: jest.fn()
}

module.exports = genesysMock
export {}
