const mockClient = {
  setEnvironment: jest.fn(),
  setAccessToken: jest.fn(),
  loginImplicitGrant: jest.fn()
}

const mockGenesys = {
  ApiClient: {
    instance: mockClient
  },
  ConversationsApi: function () {
    return {
      getConversation: jest.fn(
        async (conversationId: string): Promise<object | undefined> => {
          if (conversationId === 'fake-conversation-id') {
            const conversation = {
              participants: [
                {
                  purpose: 'customer',
                  aniName: '1234',
                  calls: [
                    {
                      self: {
                        addressRaw: '123123132@fake-node'
                      }
                    }
                  ]
                },
                {
                  purpose: 'agent',
                  calls: [
                    {
                      state:
                        (window as any).testParams.genesysInactive === true
                          ? 'disconnected'
                          : 'connected',
                      held: (window as any).testParams.genesysHeld ?? false,
                      muted: (window as any).testParams.genesysMuted ?? false
                    }
                  ]
                }
              ]
            }
            return conversation
          } else {
            throw Error('Conversation id not found')
          }
        }
      )
    }
  },
  NotificationsApi: function () {
    return {
      postNotificationsChannels: async (): Promise<void> => {
        await Promise.resolve()
      }
    }
  },
  UsersApi: function () {
    return {
      getUsersMe: jest.fn(() => ({
        id: 'e02618ce-1ae8-4429-bdb0-2d55f701a545',
        name: 'John'
      }))
    }
  }
}

module.exports = mockGenesys
export default mockGenesys
export {}
