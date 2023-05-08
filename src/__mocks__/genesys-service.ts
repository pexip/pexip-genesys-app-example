const genesysMock = {
  initialize: jest.fn(),
  isCallActive: () => true,
  isDialOut: () => true,
  addMuteListener: jest.fn(),
  addHoldListener: jest.fn(),
  addEndCallListener: jest.fn(),
  addConnectCallListener: jest.fn(),
  fetchAniName: jest.fn(),
  g: jest.fn(),
  getAgentName: jest.fn(),
  isHeld: jest.fn(),
  isMuted: jest.fn(),
  hasBillingPermission: () => true
}

module.exports = genesysMock
export {}
