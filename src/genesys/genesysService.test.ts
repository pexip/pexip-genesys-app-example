import { GenesysConnectionsState } from '../constants/GenesysConnectionState'
import '../__mocks__/test-params'

import { CallEvent } from './genesysService'

jest.mock('purecloud-platform-client-v2/dist/node/purecloud-platform-client-v2.js', () => {
  return require('../__mocks__/purecloud-platform-client-v2')
})

let triggerEvent: Function
jest.mock('./notificationsController', () => ({
  __esModule: true,
  default: {
    addSubscription: jest.fn((topic: string, callback: Function): void => {
      triggerEvent = callback
    }),
    createChannel: async (): Promise<void> => await Promise.resolve()
  }
}))

const mockParticipant = {
  // In a call we will have 4 participants with different purpose: agent, customer, ivr and acd
  purpose: 'agent',
  held: false,
  muted: false,
  user: {
    id: 'e02618ce-1ae8-4429-bdb0-2d55f701a545'
  }
}

let state: any
let accessToken: string

describe('Genesys service', () => {
  let GenesysService: any
  let PlatformClient: any
  let callEvent: CallEvent

  beforeEach(async () => {
    // Reset modules for every test
    GenesysService = await import ('./genesysService')
    PlatformClient = await import('../__mocks__/purecloud-platform-client-v2')
    jest.resetModules()
    // Reset variables
    state = {
      pcEnvironment: 'fake-environment',
      pcConversationId: 'fake-conversation-id'
    }
    accessToken = 'fake-access-token'

    callEvent = {
      version: '2',
      topicName: 'v2.users.e02618ce-1ae8-4429-bdb0-2d55f701a545.conversations.calls',
      metadata: {
        CorrelationId: 'cb1ebce9-ea91-4def-8332-a4b825dd6f61'
      },
      eventBody: {
        id: '4a4a33a5-52ca-4698-8dce-f93ff21dc404',
        participants: [Object.assign({}, mockParticipant)],
        recordingState: 'active'
      }
    };

    (window as any).testParams.genesysHeld = false;
    (window as any).testParams.genesysMuted = false;
    (window as any).testParams.genesysInactive = false
  })

  describe('loginPureCloud', () => {
    const pcEnvironment = 'fake-environment'
    const pcConversationId = 'fake-conversation-id'
    const pexipNode = 'fake-node'
    const pexipAgentPin = 'fake-pin'
    const pexipAppPrefix = 'fake-prefix'

    it('should set the client environment', async () => {
      await GenesysService.loginPureCloud(
        pcEnvironment,
        pcConversationId,
        pexipNode,
        pexipAgentPin,
        pexipAppPrefix
      )
      expect(PlatformClient.ApiClient.instance.setEnvironment).toBeCalledTimes(1)
      expect(PlatformClient.ApiClient.instance.setEnvironment).toBeCalledWith(pcEnvironment)
    })

    it('should call to "loginImplicitGrant"', async () => {
      await GenesysService.loginPureCloud(
        pcEnvironment,
        pcConversationId,
        pexipNode,
        pexipAgentPin,
        pexipAppPrefix
      )
      expect(PlatformClient.ApiClient.instance.loginImplicitGrant).toBeCalledTimes(1)
    })
  })

  describe('initialize', () => {
    it('should set the environment', async () => {
      await GenesysService.initialize(state, accessToken)
      expect(PlatformClient.ApiClient.instance.setEnvironment).toBeCalledTimes(1)
      expect(PlatformClient.ApiClient.instance.setEnvironment).toBeCalledWith(state.pcEnvironment)
    })

    it('should set the access token', async () => {
      await GenesysService.initialize(state, accessToken)
      expect(PlatformClient.ApiClient.instance.setAccessToken).toBeCalledTimes(1)
      expect(PlatformClient.ApiClient.instance.setAccessToken).toBeCalledWith(accessToken)
    })
  })

  describe('fetchAniName', () => {
    it('should recover the aniName', async () => {
      await GenesysService.initialize(state, accessToken)
      const aniName = await GenesysService.fetchAniName()
      expect(aniName).toBe('1234')
    })

    it('should return a rejected promise if the conversationId doesn\'t exist', async () => {
      state.pcConversationId = 'wrong-conversationId'
      await GenesysService.initialize(state, accessToken)
      const promise = GenesysService.fetchAniName()
      await expect(promise).rejects.toEqual(new Error('Conversation id not found'))
    })
  })

  describe('getAgentName', () => {
    it('should retrieve the own name', async () => {
      await GenesysService.initialize(state, accessToken)
      const agentName = GenesysService.getAgentName()
      expect(agentName).toBe('John')
    })

    it('should retrieve \'Agent\' if \'name\' not defined', () => {
      const agentName = GenesysService.getAgentName()
      expect(agentName).toBe('Agent')
    })
  })

  describe('isHeld', () => {
    it('should return \'false\' when the call is not on hold', async () => {
      await GenesysService.initialize(state, accessToken)
      const hold = await GenesysService.isHeld()
      expect(hold).toBeFalsy()
    })

    it('should return \'true\' when the call is on hold', async () => {
      await GenesysService.initialize(state, accessToken);
      (window as any).testParams.genesysHeld = true
      const hold = await GenesysService.isHeld()
      expect(hold).toBeTruthy()
    })
  })

  describe('isMuted', () => {
    it('should return \'false\' when the call is not muted', async () => {
      await GenesysService.initialize(state, accessToken)
      const muted = await GenesysService.isHeld()
      expect(muted).toBeFalsy()
    })

    it('should return \'true\' when the call is muted', async () => {
      await GenesysService.initialize(state, accessToken);
      (window as any).testParams.genesysMuted = true
      const muted = await GenesysService.isMuted()
      expect(muted).toBeTruthy()
    })
  })

  describe('isDialout', () => {
    it('should return \'true\' when the call addressRaw does end with pexip node', async () => {
      await GenesysService.initialize(state, accessToken)
      const isDialOut = await GenesysService.isDialOut('fake-node')
      expect(isDialOut).toBeTruthy()
    })

    it('should return \'false\' when the call addressRaw does not end with pexip node', async () => {
      await GenesysService.initialize(state, accessToken)
      const isDialOut = await GenesysService.isDialOut('anything-else')
      expect(isDialOut).toBeFalsy()
    })
  })

  describe('isCallActive', () => {
    it('should return \'false\' when the call is not inactive', async () => {
      await GenesysService.initialize(state, accessToken);
      (window as any).testParams.genesysInactive = true
      const active = await GenesysService.isCallActive()
      expect(active).toBeFalsy()
    })

    it('should return \'true\' when the call is active', async () => {
      await GenesysService.initialize(state, accessToken)
      const active = await GenesysService.isCallActive()
      expect(active).toBeTruthy()
    })
  })

  describe('addHoldListener', () => {
    it('should trigger \'handleHold\' when the agent push on hold', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockHold = jest.fn()
      GenesysService.addMuteListener(jest.fn())
      GenesysService.addHoldListener(mockHold)
      callEvent.eventBody.participants[0].held = true
      triggerEvent(callEvent)
      expect(mockHold).toBeCalledTimes(1)
    })
  })

  describe('addEndCallListener', () => {
    it('should trigger \'handleEndCall\' with \'shouldDisconnectAll=true\' when the agent disconnects', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'client'
      triggerEvent(callEvent)
      expect(mockEndCall).toBeCalledTimes(1)
      expect(mockEndCall).toBeCalledWith(true)
    })

    it('should trigger \'handleEndCall\' with \'shouldDisconnectAll=false\' when transfer (blind and consult)', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'transfer'
      triggerEvent(callEvent)
      expect(mockEndCall).toBeCalledTimes(1)
      expect(mockEndCall).toBeCalledWith(false)
    })

    it('shouldn\'t trigger \'handleEndCall\' with any other disconnect type', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'peer'
      triggerEvent(callEvent)
      expect(mockEndCall).toBeCalledTimes(1)
      expect(mockEndCall).toBeCalledWith(false)
    })
  })

  describe('addMuteListener', () => {
    it('should trigger \'handleMuteListener\' when the agent mutes the audio', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockMute = jest.fn()
      GenesysService.addMuteListener(mockMute)
      callEvent.eventBody.participants[0].muted = true
      triggerEvent(callEvent)
      expect(mockMute).toBeCalledTimes(1)
    })
  })

  describe('addConnectCallListener', () => {
    it('should trigger \'handleConnectCallListener\' when a call is connected', async () => {
      await GenesysService.initialize(state, accessToken)
      const mockCallConnect = jest.fn()
      GenesysService.addConnectCallListener(mockCallConnect)
      callEvent.eventBody.participants[0].state = GenesysConnectionsState.CONNECTED
      triggerEvent(callEvent)
      expect(mockCallConnect).toBeCalledTimes(1)
    })
  })
})
