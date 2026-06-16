export const initialize = jest.fn()
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
