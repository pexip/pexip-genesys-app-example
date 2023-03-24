const genesysMock = {
  initialize: jest.fn(),
  isCallActive: () => true,
  addMuteListener: jest.fn(),
  addHoldListener: jest.fn(),
  addEndCallListener: jest.fn(),
  addConnectCallListener: jest.fn(),
  fetchAniName: jest.fn(),
  getAgentName: jest.fn(),
  isHeld: jest.fn(),
  isMuted: jest.fn()
}

module.exports = genesysMock
export {}
