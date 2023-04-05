import {
  ConversationsApi,
  Models,
  UsersApi
} from 'purecloud-platform-client-v2'
import { GenesysRole } from '../constants/GenesysRole'
import { GenesysConnectionsState } from '../constants/GenesysConnectionState'
import config from '../config.js'
import controller from './notificationsController.js'
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const platformClient = require('purecloud-platform-client-v2/dist/node/purecloud-platform-client-v2.js')

const redirectUri = window.location.href.split('?')[0]

let clientId: string
if (process.env.NODE_ENV === 'development') {
  clientId = config.genesys.devOauthClientID
} else {
  clientId = config.genesys.prodOauthClientID
}

const client = platformClient.ApiClient.instance

let state: GenesysState

let userMe: Models.UserMe

let pexipAgentPrefix: string

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let usersApi: UsersApi
let conversationsApi: ConversationsApi

let handleHold: (flag: boolean) => any
let handleEndCall: (shouldDisconnectAll: boolean) => any
let handleMuteCall: (flag: boolean) => any
let handleConnectCall: () => any

let onHoldState: boolean = false
let muteState: boolean = false

/**
 * @param pcEnvironment The environment context of the current Genesys session
 * @param conversationId The current conversation id for the running interaction
 */
interface GenesysState {
  pcEnvironment: string
  pcConversationId: string
  pexipAgentPrefix: string
}

/**
 * Triggers the login process for Genesys
 * @param pcEnvironment ToDo
 * @param pcConversationId ToDo
 * @param pexipNode ToDo
 * @param pexipAgentPin ToDo
 * @param pexipAgentPrefix ToDo
 */
export const loginPureCloud = async (
  pcEnvironment: string,
  pcConversationId: string,
  pexipNode: string,
  pexipAgentPin: string,
  pexipAgentPrefix: string
): Promise<void> => {
  client.setEnvironment(pcEnvironment)
  await client.loginImplicitGrant(clientId, redirectUri, {
    state: JSON.stringify({
      pcEnvironment,
      pcConversationId,
      pexipNode,
      pexipAgentPin,
      pexipAgentPrefix
    })
  })
}

/**
 * Initiates the Genesys util object
 * @param genesysState The necessary context information for the genesys util
 * @param accessToken The access token provided by Genesys after successful login
 */
export const initialize = async (
  genesysState: GenesysState,
  accessToken: string
): Promise<void> => {
  const client = platformClient.ApiClient.instance
  state = genesysState
  client.setEnvironment(state.pcEnvironment)
  client.setAccessToken(accessToken)
  usersApi = new platformClient.UsersApi(client)
  conversationsApi = new platformClient.ConversationsApi(client)
  userMe = await usersApi.getUsersMe()
  pexipAgentPrefix = state.pexipAgentPrefix
  await controller.createChannel()
  if (userMe.id != null) {
    controller.addSubscription(
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
  const conversation = await conversationsApi.getConversation(
    state.pcConversationId
  )
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
 * Provides the agent prefix that is part of the integration URL
 * @returns The agents prefix (returns "agent" if name is undefined)
 */
export const getAgentPrefix = (): string => {
  return pexipAgentPrefix ?? 'agent'
}

/**
 * Reads agents hold state
 * @returns Returns the hold state of the active call
 */
export const isHeld = async (): Promise<boolean> => {
  const agentParticipant = await getActiveAgent()
  const connectedCall = agentParticipant?.calls?.find(
    (call) => call.state === 'connected'
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
    (call) => call.state === 'connected'
  )
  return connectedCall?.muted ?? false
}

/**
 * Get if the is a active call or not.
 * @returns Boolean that indicates that a call is active.
 */
export const isCallActive = async (): Promise<boolean> => {
  const conversation = await conversationsApi.getConversation(
    state.pcConversationId
  )
  const agentParticipants = conversation.participants?.filter(
    (participant) => participant.purpose === GenesysRole.AGENT
  )
  const calls = agentParticipants
    .map((participant) => participant.calls)
    .flatMap((calls) => calls)
  const active = calls.some(
    (call) => call?.state === GenesysConnectionsState.CONNECTED
  )
  return active
}

export function addHoldListener (holdListener: (flag: boolean) => any): void {
  handleHold = holdListener
}

export function addEndCallListener (
  endCallListener: (shouldDisconnectAll: boolean) => any
): void {
  handleEndCall = endCallListener
}

export function addMuteListener (
  muteCallListener: (flag: boolean) => any
): void {
  handleMuteCall = muteCallListener
}

export function addConnectCallListener (
  handleConnectCallListener: () => any
): void {
  handleConnectCall = handleConnectCallListener
}

/**
 * Returns the active agent (endtime === undefined && purpose === 'agent')
 * @returns The active agent.
 */
const getActiveAgent = async (): Promise<Models.Participant | undefined> => {
  const conversation = await conversationsApi.getConversation(
    state.pcConversationId
  )
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
      participant.state !== 'terminated' &&
      userMe.id === participant.user?.id
  )

  // Disconnect event
  if (agentParticipant?.state === GenesysConnectionsState.DISCONNECTED) {
    if (agentParticipant?.disconnectType === GenesysDisconnectType.CLIENT) {
      // Disconnect all the user when agent disconnect
      handleEndCall(true)
    }
    if (agentParticipant?.disconnectType === GenesysDisconnectType.TRANSFER) {
      // Only disconnect the transfer iniitiating agent
      handleEndCall(false)
    }
    if (agentParticipant?.disconnectType === GenesysDisconnectType.PEER) {
      // Disconnect the sip call associated agent if the call sip call was terminated by Infinity
      handleEndCall(false)
    }
  }

  // Connect event
  if (agentParticipant?.state === GenesysConnectionsState.CONNECTED) {
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
