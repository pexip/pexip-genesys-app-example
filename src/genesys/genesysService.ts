import { ConversationsApi, Models, UsersApi } from 'purecloud-platform-client-v2'
import { GenesysRole } from '../constants/GenesysRole'
import { GenesysConnectionsState } from '../constants/GenesysConnectionState'
import config from '../config.js'
import controller from './notificationsController.js'

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

let handleEndCall: () => any

let handleMuteCall: (flag: boolean) => any

export let onHoldState: boolean = false

export let muteState: boolean = false

/**
 * @param pcEnvironment The enviroment context of the current Genesys session
 * @param conversationId The current conversation id for the running interaction
 */
interface genesysState {
  'pcEnvironment': string
  'pcConversationId': string
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
  pexipAgentPin: string): Promise<void> => {
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
export const inititate = async (genesysState: genesysState, accessToken: string): Promise<void> => {
  const client = platformClient.ApiClient.instance
  state = genesysState
  console.log(state.pcEnvironment)
  client.setEnvironment(state.pcEnvironment)
  client.setAccessToken(accessToken)
  console.log(client)
  usersApi = new platformClient.UsersApi(client)
  conversationApi = new platformClient.ConversationsApi(client)
  userMe = await usersApi.getUsersMe()
  controller.createChannel().then(() => {
    controller.addSubscription(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `v2.users.${userMe.id}.conversations.calls`,
      (callEvent: { eventBody: { participants: any[] } }) => {
        const agentParticipant = callEvent?.eventBody?.participants?.find((p: { purpose: string, state: string }) => p.purpose === GenesysRole.AGENT)
        // Disconnected event
        if (agentParticipant?.state === GenesysConnectionsState.DISCONNECTED) {
          console.log('Agent has ended the call')
          handleEndCall()
        }
        // Mute event
        if (muteState !== agentParticipant?.muted) {
          muteState = agentParticipant?.muted
          processMute(muteState)
        }
        // On hold event
        if (onHoldState !== agentParticipant?.held) {
          onHoldState = agentParticipant?.held
          processHold(onHoldState)
        }
      })
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
  const aniName = await conversationApi.getConversation(state.pcConversationId).then((conversation) => {
    return conversation.participants?.filter((p) => p.purpose === GenesysRole.CUSTOMER)[0]?.aniName
  })
  return aniName
}

export function addHoldListener (holdListener: (flag: boolean) => any): void {
  handleHold = holdListener
}

export function addEndCallLister (endCallListener: () => any): void {
  handleEndCall = endCallListener
}

export function addMuteListenr (muteCallListener: (flag: boolean) => any): void {
  handleMuteCall = muteCallListener
}
