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

let state: genesysState

let userMe: Models.UserMe

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let usersApi: UsersApi

let conversationApi: ConversationsApi

let handleHold: (flag: boolean) => any

let handleEndCall: (disconnectAll: boolean) => any

let handleMuteCall: (flag: boolean) => any

let onHoldState: boolean = false

let muteState: boolean = false

let initialDisconnectType: string

/**
 * @param pcEnvironment The enviroment context of the current Genesys session
 * @param conversationId The current conversation id for the running interaction
 */
interface genesysState {
  pcEnvironment: string
  pcConversationId: string
}

/**
 * Triggers the login process for Genesys
 * @param pcEnvironment ToDo
 * @param pcConversationId ToDo
 * @param pexipNode ToDo
 * @param pexipAgentPin ToDo
 */
export const loginPureCloud = async (
  pcEnvironment: string,
  pcConversationId: string,
  pexipNode: string,
  pexipAgentPin: string
): Promise<void> => {
  client.setEnvironment(pcEnvironment)
  await client.loginImplicitGrant(clientId, redirectUri, {
    state: JSON.stringify({
      pcEnvironment,
      pcConversationId,
      pexipNode,
      pexipAgentPin
    })
  })
}

/**
 * Initiates the Genesys util object
 * @param genesysState The necessary context information for the genesys util
 * @param accessToken The access token provided by Genesys after successful login
 */
export const initialize = async (
  genesysState: genesysState,
  accessToken: string
): Promise<void> => {
  const client = platformClient.ApiClient.instance
  state = genesysState
  client.setEnvironment(state.pcEnvironment)
  client.setAccessToken(accessToken)
  usersApi = new platformClient.UsersApi(client)
  conversationApi = new platformClient.ConversationsApi(client)
  userMe = await usersApi.getUsersMe()
  controller.createChannel().then(() => {
    controller.addSubscription(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `v2.users.${userMe.id}.conversations.calls`,
      (callEvent: { eventBody: { participants: any[] } }) => {
        const agentParticipant: Models.QueueConversationCallEventTopicCallMediaParticipant =
          callEvent?.eventBody?.participants?.find(
            (p: Models.QueueConversationCallEventTopicCallMediaParticipant) =>
              p.purpose === GenesysRole.AGENT && p.state !== 'terminated' && (userMe.id === p.user?.id)
          )
        // Disconnected event
        // Do not disconenct agent app from infinity if disconnectType is transfer
        if (agentParticipant?.state === GenesysConnectionsState.DISCONNECTED) {
          // Keep the initial disconnectType because a "peer" type
          // will be triggered by a disconnect in context of a consult transfer additional to the "transfer" type
          initialDisconnectType = initialDisconnectType ?? agentParticipant?.disconnectType
          console.log(
            'Call has ended - Reason: ' + (agentParticipant?.disconnectType ?? '')
          )
          switch (agentParticipant?.disconnectType) {
            // Disconnect all for client and peer
            case GenesysDisconnectType.CLIENT:
            case GenesysDisconnectType.PEER:
              // Only handle the "peer" type if initialDisconnectType is not "transfer"
              // "peer" is triggered if the sip particpipant is disconnected e.g. by infinity e.g.
              if (initialDisconnectType !== GenesysDisconnectType.TRANSFER) {
                handleEndCall(true)
              }
              break
            // Disconnect the agent for transfer
            case GenesysDisconnectType.TRANSFER:
              handleEndCall(false)
              break
            // Disconnect all for all other cases ToDo: Check if other cases must behandled properly
            default:
              handleEndCall(true)
          }
        }
        // Mute event
        if (muteState !== agentParticipant?.muted) {
          muteState = agentParticipant?.muted ?? false
          processMute(muteState)
        }
        // On hold event
        if (onHoldState !== agentParticipant?.held) {
          onHoldState = agentParticipant?.held ?? false
          processHold(onHoldState)
        }
      }
    )
  })
  console.info('Genesys client layer initated')
}

function processHold (flag: boolean): void {
  if (flag) {
    console.log('Agent has set the call on hold')
  } else {
    console.log('Agent has continued the call')
  }
  handleHold(flag)
}

function processMute (flag: boolean): void {
  if (flag) {
    console.log('Agent has muted the call')
  } else {
    console.log('Agent has unmuted the call')
  }
  // Only process mute if onhold is not active
  if (!onHoldState) {
    handleMuteCall(flag)
  }
}

/**
 * Fetches the ani name provided by inbound SIP call. It uses the conversationid provided during initialization
 * @returns The ani name which will be used as alias for the meeting
 */
export const fetchAniName = async (): Promise<string | undefined> => {
  const aniName = await conversationApi
    .getConversation(state.pcConversationId)
    .then((conversation) => {
      return conversation.participants?.filter(
        (p) => p.purpose === GenesysRole.CUSTOMER
      )[0]?.aniName
    })
  return aniName
}

/**
 * Reads agents displayname via Genesys API
 * @returns The agents displayname (returns "Agent" if name is undefined)
 */
export const fetchAgentName = async (): Promise<string> => {
  return userMe.name ?? 'Agent'
}

/**
 * Reads agents hold state
 * @returns Returns the hold state of the active call
 */
export const isHold = async (): Promise<boolean> => {
  const agentParticipant = await getActiveAgent()
  const connectedCAll = agentParticipant?.calls?.find(
    (call) => call.state === 'connected'
  )
  return connectedCAll?.held ?? false
}

/**
 * Reads agents mute state
 * @returns Returns the mute state of the active call
 */
export const isMuted = async (): Promise<boolean> => {
  const agentParticipant = await getActiveAgent()
  const connectedCAll = agentParticipant?.calls?.find(
    (call) => call.state === 'connected'
  )
  return connectedCAll?.muted ?? false
}

export const isCallActive = async (): Promise<boolean> => {
  const calls = await conversationApi
    .getConversation(state.pcConversationId)
    .then((conversation) => {
      return conversation.participants
        ?.filter((p) => p.purpose === GenesysRole.AGENT)
        .map((participant) => participant.calls)
        .flatMap((calls) => calls)
    })
  return (
    calls?.find((call) => call?.state === GenesysConnectionsState.CONNECTED) !=
    null
  )
}

/**
 * Returns the active agent (endtime === undefined && purpose === 'agent')
 * @returns The active agent
 */
const getActiveAgent = async (): Promise<Models.Participant | undefined> => {
  const conversation = await conversationApi.getConversation(
    state.pcConversationId
  )
  const agentParticipant = conversation?.participants.find(
    (p) => p.purpose === GenesysRole.AGENT && p.endTime === undefined
  )
  return agentParticipant
}

export function addHoldListener (holdListener: (flag: boolean) => any): void {
  handleHold = holdListener
}

export function addEndCallListener (endCallListener: (disconnectAll: boolean) => any): void {
  handleEndCall = endCallListener
}

export function addMuteListener (
  muteCallListener: (flag: boolean) => any
): void {
  handleMuteCall = muteCallListener
}
