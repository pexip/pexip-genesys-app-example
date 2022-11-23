import { AuthData } from 'purecloud-platform-client-v2'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const platformClient = require('purecloud-platform-client-v2/dist/node/purecloud-platform-client-v2.js')

const clientId = 'fa593b6d-c2f1-40a7-8a8f-a26fe7575f16'
const redirectUri = 'https://localhost:3000' // Take into account that we are inside an iframe

const client = platformClient.ApiClient.instance

export const loginPureCloud = async (
  pcEnvironment: string,
  pcConversationId: string,
  pexipNode: string,
  pexipAgentPin: string): Promise<AuthData> => {
  client.setPersistSettings(true)
  client.setEnvironment(pcEnvironment)
  const authData = await client.loginImplicitGrant(clientId, redirectUri, {
    state: JSON.stringify({
      pcConversationId,
      pexipNode,
      pexipAgentPin
    })
  })
  console.log(authData)
  return authData
}

export const setAccessTokenPureCloud = async (accessToken: string): Promise<void> => {
  const client = platformClient.ApiClient.instance
  client.setAccessToken(accessToken)
  const usersApi = new platformClient.UsersApi(client)
  console.log(usersApi.getUsersMe({ expand: ['presence'] }))
}
