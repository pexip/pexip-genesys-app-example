import '../__mocks__/test-params'
import { GenesysConnectionsState } from '../constants/GenesysConnectionState'
import { type CallEvent } from './genesysService'

let triggerEvent: (event: any) => void
jest.mock('./notificationsController', () => ({
  addSubscription: jest.fn((_topic: string, callback: () => void): void => {
    triggerEvent = callback
  }),
  createChannel: async (): Promise<void> => {
    await Promise.resolve()
  }
}))

const customerMock = {
  purpose: 'customer',
  held: false,
  muted: false,
  state: 'connected',
  disconnectType: undefined,
  user: {
    id: 'f02618ce-1ae8-4429-bdb0-2d55f701a546'
  }
}

const agentMock = {
  // In a call we will have 4 participants with different purpose: agent, customer, ivr and acd
  purpose: 'agent',
  held: false,
  muted: false,
  state: 'connected',
  disconnectType: undefined,
  user: {
    id: 'e02618ce-1ae8-4429-bdb0-2d55f701a545'
  }
}

describe('Genesys service', () => {
  let GenesysService: any
  let PlatformClient: any
  let pcEnvironment: string
  let pcConversationId: string
  let accessToken: string
  let callEvent: CallEvent

  beforeEach(async () => {
    // Reset modules for every test
    GenesysService = await import('./genesysService')
    PlatformClient = await import('../__mocks__/purecloud-platform-client-v2')
    jest.resetModules()

    // Reset variables
    pcEnvironment = 'fake-environment'
    pcConversationId = 'fake-conversation-id'
    accessToken = 'fake-access-token'

    callEvent = {
      version: '2',
      topicName:
        'v2.users.e02618ce-1ae8-4429-bdb0-2d55f701a545.conversations.calls',
      metadata: {
        CorrelationId: 'cb1ebce9-ea91-4def-8332-a4b825dd6f61'
      },
      eventBody: {
        id: '4a4a33a5-52ca-4698-8dce-f93ff21dc404',
        participants: [
          Object.assign({}, agentMock),
          Object.assign({}, customerMock)
        ],
        recordingState: 'active'
      }
    }
    ;(window as any).testParams.genesysHeld = false
    ;(window as any).testParams.genesysMuted = false
    ;(window as any).testParams.genesysInactive = false
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
      expect(
        PlatformClient.ApiClient.instance.setEnvironment
      ).toHaveBeenCalledTimes(1)
      expect(
        PlatformClient.ApiClient.instance.setEnvironment
      ).toHaveBeenCalledWith(pcEnvironment)
    })

    it('should call to "loginImplicitGrant"', async () => {
      await GenesysService.loginPureCloud(
        pcEnvironment,
        pcConversationId,
        pexipNode,
        pexipAgentPin,
        pexipAppPrefix
      )
      expect(
        PlatformClient.ApiClient.instance.loginImplicitGrant
      ).toHaveBeenCalledTimes(1)
    })
  })

  describe('initialize', () => {
    it('should set the environment', async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      expect(
        PlatformClient.ApiClient.instance.setEnvironment
      ).toHaveBeenCalledTimes(1)
      expect(
        PlatformClient.ApiClient.instance.setEnvironment
      ).toHaveBeenCalledWith(pcEnvironment)
    })

    it('should set the access token', async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      expect(
        PlatformClient.ApiClient.instance.setAccessToken
      ).toHaveBeenCalledTimes(1)
      expect(
        PlatformClient.ApiClient.instance.setAccessToken
      ).toHaveBeenCalledWith(accessToken)
    })
  })

  describe('fetchAniName', () => {
    it('should recover the aniName', async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const aniName = await GenesysService.fetchAniName()
      expect(aniName).toBe('1234')
    })

    it("should return a rejected promise if the conversationId doesn't exist", async () => {
      pcConversationId = 'wrong-conversationId'
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const promise = GenesysService.fetchAniName()
      await expect(promise).rejects.toEqual(
        new Error('Conversation id not found')
      )
    })
  })

  describe('getAgentName', () => {
    it('should retrieve the own name', async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const agentName = GenesysService.getAgentName()
      expect(agentName).toBe('John')
    })

    it("should retrieve 'Agent' if 'name' not defined", () => {
      const agentName = GenesysService.getAgentName()
      expect(agentName).toBe('Agent')
    })
  })

  describe('isHeld', () => {
    it("should return 'false' when the call is not on hold", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const hold = await GenesysService.isHeld()
      expect(hold).toBeFalsy()
    })

    it("should return 'true' when the call is on hold", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      ;(window as any).testParams.genesysHeld = true
      const hold = await GenesysService.isHeld()
      expect(hold).toBeTruthy()
    })
  })

  describe('isMuted', () => {
    it("should return 'false' when the call is not muted", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const muted = await GenesysService.isMuted()
      expect(muted).toBeFalsy()
    })

    it("should return 'true' when the call is muted", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      ;(window as any).testParams.genesysMuted = true
      const muted = await GenesysService.isMuted()
      expect(muted).toBeTruthy()
    })
  })

  describe('isDialout', () => {
    it("should return 'true' when the call addressRaw does end with pexip node", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const isDialOut = await GenesysService.isDialOut('fake-node')
      expect(isDialOut).toBeTruthy()
    })

    it("should return 'false' when the call addressRaw does not end with pexip node", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const isDialOut = await GenesysService.isDialOut('anything-else')
      expect(isDialOut).toBeFalsy()
    })
  })

  describe('isCallActive', () => {
    it("should return 'false' when the call is not inactive", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      ;(window as any).testParams.genesysInactive = true
      const active = await GenesysService.isCallActive()
      expect(active).toBeFalsy()
    })

    it("should return 'true' when the call is active", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const active = await GenesysService.isCallActive()
      expect(active).toBeTruthy()
    })
  })

  describe('addHoldListener', () => {
    it("should trigger 'handleHold' when the agent push on hold", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockHold = jest.fn()
      GenesysService.addConnectCallListener(jest.fn())
      GenesysService.addMuteListener(jest.fn())
      GenesysService.addHoldListener(mockHold)
      callEvent.eventBody.participants[0].held = true
      triggerEvent(callEvent)
      expect(mockHold).toHaveBeenCalledTimes(1)
    })
  })

  describe('addEndCallListener', () => {
    it("should trigger 'handleEndCall' with 'shouldDisconnectAll=true' when the agent disconnects", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'client'
      triggerEvent(callEvent)
      expect(mockEndCall).toHaveBeenCalledTimes(1)
      expect(mockEndCall).toHaveBeenCalledWith(true)
    })

    it("should trigger 'handleEndCall' with 'shouldDisconnectAll=false' when transfer (blind and consult)", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'transfer'
      triggerEvent(callEvent)
      expect(mockEndCall).toHaveBeenCalledTimes(1)
      expect(mockEndCall).toHaveBeenCalledWith(false)
    })

    it("shouldn't trigger 'handleEndCall' with any other disconnect type", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockEndCall = jest.fn()
      GenesysService.addEndCallListener(mockEndCall)
      callEvent.eventBody.participants[0].state = 'disconnected'
      callEvent.eventBody.participants[0].disconnectType = 'peer'
      triggerEvent(callEvent)
      expect(mockEndCall).toHaveBeenCalledTimes(1)
      expect(mockEndCall).toHaveBeenCalledWith(false)
    })
  })

  describe('addMuteListener', () => {
    it("should trigger 'handleMuteListener' when the agent mutes the audio", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockMute = jest.fn()
      GenesysService.addConnectCallListener(jest.fn())
      GenesysService.addMuteListener(mockMute)
      callEvent.eventBody.participants[0].muted = true
      triggerEvent(callEvent)
      expect(mockMute).toHaveBeenCalledTimes(1)
    })
  })

  describe('addConnectCallListener', () => {
    it("should trigger 'handleConnectCallListener' when a call is connected", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockCallConnect = jest.fn()
      GenesysService.addConnectCallListener(mockCallConnect)
      callEvent.eventBody.participants[0].state =
        GenesysConnectionsState.Connected
      callEvent.eventBody.participants[1].state =
        GenesysConnectionsState.Connected
      triggerEvent(callEvent)
      expect(mockCallConnect).toHaveBeenCalledTimes(1)
    })

    it("shouldn't trigger 'handleConnectCallListener' when the customer is disconnected", async () => {
      await GenesysService.initialize(
        pcEnvironment,
        pcConversationId,
        accessToken
      )
      const mockCallConnect = jest.fn()
      GenesysService.addConnectCallListener(mockCallConnect)
      callEvent.eventBody.participants[0].state =
        GenesysConnectionsState.Connected
      callEvent.eventBody.participants[1].state =
        GenesysConnectionsState.Disconnected
      triggerEvent(callEvent)
      expect(mockCallConnect).toHaveBeenCalledTimes(0)
    })
  })
})
