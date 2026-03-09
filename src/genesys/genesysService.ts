import type {
  ConversationsApi,
  Models,
  UsersApi
} from 'purecloud-platform-client-v2'
import platformClient from 'purecloud-platform-client-v2'
import { GenesysRole } from '../constants/GenesysRole'
import { GenesysConnectionsState } from '../constants/GenesysConnectionState'
import { createChannel, addSubscription } from './notificationsController.ts'
import { GenesysDisconnectType } from '../constants/GenesysDisconnectType'

export interface CallEvent {
  version: string
  topicName: string
  metadata: {
    CorrelationId: string
  }
  eventBody: {
    id: string
    participants: Models.ConversationCallEventTopicCallMediaParticipant[]
    recordingState: string // e.g. "active"
  }
}

const redirectUri = window.location.href.split('?')[0]

const clientId: string = import.meta.env.VITE_GENESYS_OAUTH_CLIENT_ID
if (clientId === undefined) {
  throw new Error('VITE_GENESYS_OAUTH_CLIENT_ID is not defined')
}

const client = platformClient.ApiClient.instance

const billablePermission = 'integration:pexipVideo:agent'

let conversationId: string

let userMe: Models.UserMe

let usersApi: UsersApi
let conversationsApi: ConversationsApi

let handleHold: (flag: boolean) => any
let handleEndCall: (shouldDisconnectAll: boolean) => any
let handleMuteCall: (flag: boolean) => any
let handleConnectCall: () => any

let onHoldState: boolean = false
let muteState: boolean = false

/**
 * Triggers the login process for Genesys
 * @param pcEnvironment ToDo
 * @param pcConversationId ToDo
 * @param pexipNode ToDo
 * @param pexipAgentPin ToDo
 * @param pexipAppPrefix ToDo
 */
export const loginPureCloud = async (
  pcEnvironment: string,
  pcConversationId: string,
  pexipNode: string,
  pexipAgentPin: string,
  pexipAppPrefix: string
): Promise<void> => {
  client.setEnvironment(pcEnvironment)
  await client.loginImplicitGrant(clientId, redirectUri, {
    state: JSON.stringify({
      pcEnvironment,
      pcConversationId,
      pexipNode,
      pexipAgentPin,
      pexipAppPrefix
    })
  })
}

/**
 * Initiates the Genesys util object
 * @param genesysState The necessary context information for the Genesys util
 * @param accessToken The access token provided by Genesys after successful login
 */
export const initialize = async (
  pcEnvironment: string,
  pcConversationId: string,
  accessToken: string
): Promise<void> => {
  conversationId = pcConversationId
  const client = platformClient.ApiClient.instance
  client.setEnvironment(pcEnvironment)
  client.setAccessToken(accessToken)
  usersApi = new platformClient.UsersApi()
  conversationsApi = new platformClient.ConversationsApi()
  userMe = await usersApi.getUsersMe({ expand: ['authorization'] })
  await createChannel()
  if (userMe.id != null) {
    await addSubscription(
      `v2.users.${userMe.id}.conversations.calls`,
      callsCallback
    )
  } else {
    throw Error('Cannot get the user ID')
  }
}

/**
 * Fetches the ani name provided by inbound SIP call. It uses the conversationid provided during initialization
 * @returns The ani name which will be used as alias for the meeting
 */
export const fetchAniName = async (): Promise<string | undefined> => {
  const conversation = await conversationsApi.getConversation(conversationId)
  const participant = conversation.participants?.find(
    (participant) => participant.purpose === GenesysRole.CUSTOMER
  )
  return participant?.aniName
}

/**
 * Reads agents displayname via Genesys API
 * @returns The agents displayname (returns "Agent" if name is undefined)
 */
export const getAgentName = (): string => {
  return userMe?.name ?? 'Agent'
}

/**
 * Reads agents displayname via Genesys API
 * @returns The agents displayname (returns "Agent" if name is undefined)
 */
export const hasBillingPermission = (): boolean => {
  const foundPermission = userMe.authorization?.permissions?.find(
    (permission: string) => permission === billablePermission
  )
  return foundPermission !== undefined
}

/**
 * Reads agents hold state
 * @returns Returns the hold state of the active call
 */
export const isHeld = async (): Promise<boolean> => {
  const agentParticipant = await getActiveAgent()
  const connectedCall = agentParticipant?.calls?.find(
    (call) => call.state === GenesysConnectionsState.Connected
  )
  return connectedCall?.held ?? false
}

/**
 * Reads agents mute state
 * @returns Returns the mute state of the active call
 */
export const isMuted = async (): Promise<boolean> => {
  const agentParticipant = await getActiveAgent()
  const connectedCall = agentParticipant?.calls?.find(
    (call) => call.state === GenesysConnectionsState.Connected
  )
  return connectedCall?.muted ?? false
}

/**
 * Checks if ANI reflects a PSTN call. Whitespaces will be trimmed out.
 * @param sipSource The source domain or ip of the sip call
 * @returns true if ANI is a phone number / false if ANI is not a phone number
 */
export const isDialOut = async (sipSource: string): Promise<boolean> => {
  const conversation = await conversationsApi.getConversation(conversationId)
  const participant = conversation.participants?.find(
    (participant) => participant.purpose === GenesysRole.CUSTOMER
  )

  /**  Create a the regexp dynamically.
  The regex will check the part after the @ of addressRaw (e.g. sip:165049338@pexipdemo.com)
  */
  const regExp = new RegExp(`@(${sipSource}$)`)
  const result = participant?.calls?.some((call) =>
    regExp.test(call?.self?.addressRaw ?? '')
  )
  return result ?? false
}

/**
 * Get if the is a active call or not.
 * @returns Boolean that indicates that a call is active.
 */
export const isCallActive = async (): Promise<boolean> => {
  const conversation = await conversationsApi.getConversation(conversationId)
  const agentParticipants = conversation.participants?.filter(
    (participant) => participant.purpose === GenesysRole.AGENT
  )
  const calls = agentParticipants
    .map((participant) => participant.calls)
    .flatMap((calls) => calls)
  const active = calls.some(
    (call) => call?.state === GenesysConnectionsState.Connected
  )
  return active
}

export const addHoldListener = (holdListener: (flag: boolean) => any): void => {
  handleHold = holdListener
}

export const addEndCallListener = (
  endCallListener: (shouldDisconnectAll: boolean) => any
): void => {
  handleEndCall = endCallListener
}

export const addMuteListener = (
  muteCallListener: (flag: boolean) => any
): void => {
  handleMuteCall = muteCallListener
}

export const addConnectCallListener = (
  handleConnectCallListener: () => any
): void => {
  handleConnectCall = handleConnectCallListener
}

/**
 * Returns the active agent (endtime === undefined && purpose === 'agent')
 * @returns The active agent.
 */
const getActiveAgent = async (): Promise<Models.Participant | undefined> => {
  const conversation = await conversationsApi.getConversation(conversationId)
  const agentParticipant = conversation?.participants.find(
    (participant) =>
      participant.purpose === GenesysRole.AGENT &&
      participant.endTime === undefined
  )
  return agentParticipant
}

const callsCallback = (callEvent: CallEvent): void => {
  const agentParticipant = callEvent?.eventBody?.participants?.find(
    (participant) =>
      participant.purpose === GenesysRole.AGENT &&
      participant.state !== GenesysConnectionsState.Terminated &&
      userMe.id === participant.user?.id
  )

  const customerParticipant = callEvent?.eventBody?.participants?.find(
    (participant) =>
      participant.purpose === GenesysRole.CUSTOMER &&
      participant.state !== GenesysConnectionsState.Terminated
  )

  if (agentParticipant == null || customerParticipant == null) {
    console.warn('No agent or customer participant found in call event')
    return
  }

  // Disconnect event
  if (agentParticipant?.state === GenesysConnectionsState.Disconnected) {
    if (agentParticipant?.disconnectType === GenesysDisconnectType.CLIENT) {
      // Disconnect all the user when agent disconnect
      handleEndCall(true)
    }
    if (agentParticipant?.disconnectType === GenesysDisconnectType.TRANSFER) {
      // Only disconnect the agent that initiated the transfer
      handleEndCall(false)
    }
    if (agentParticipant?.disconnectType === GenesysDisconnectType.PEER) {
      // Disconnect the sip call associated agent if the call sip call was terminated by Infinity
      handleEndCall(false)
    }
  }

  // Connect event
  // This will happen if we transfer the call to another participant and he
  // transfer the call back to us
  if (
    agentParticipant?.state === GenesysConnectionsState.Connected &&
    customerParticipant?.state === GenesysConnectionsState.Connected
  ) {
    handleConnectCall()
  }

  // Mute event
  if (muteState !== agentParticipant?.muted) {
    muteState = agentParticipant?.muted ?? false
    if (!onHoldState) {
      handleMuteCall(muteState)
    }
  }

  // On hold event
  if (onHoldState !== agentParticipant?.held) {
    onHoldState = agentParticipant?.held ?? false
    handleHold(onHoldState)
  }
}
