export const initialize = jest.fn()
export const loginPureCloud = jest.fn().mockResolvedValue({
  state: {
    pcEnvironment: 'usw2.pure.cloud',
    pcConversationId: '62698915-ae56-4efc-b5d7-71d6ad487fae',
    pexipNode: 'pexipdemo.com',
    pexipAgentPin: '2021',
    pexipAppPrefix: 'agent'
  },
  accessToken: 'fake-access-token'
})
export const relayAuthPopupResult = jest.fn().mockReturnValue(false)
export const isCallActive = (): boolean => true
export const isDialOut = (): boolean => true
export const addMuteListener = jest.fn()
export const addHoldListener = jest.fn()
export const addEndCallListener = jest.fn()
export const addConnectCallListener = jest.fn()
export const fetchAniName = jest.fn()
export const getAgentName = jest.fn()
export const isHeld = jest.fn().mockResolvedValue(false)
export const isMuted = jest.fn().mockResolvedValue(false)
export const hasBillingPermission = (): boolean => true
