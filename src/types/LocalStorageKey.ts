const prefix = 'pexip-genesys-'

export enum LocalStorageKey {
  StreamQuality = `${prefix}stream-quality`,
  VideoDeviceInfo = `${prefix}video-device-info`,
  Effect = `${prefix}effect`,
  PcEnvironment = `${prefix}pc-environment`,
  PcConversationId = `${prefix}pc-conversation-id`,
  PexipNode = `${prefix}pexip-node`,
  PexipAgentPin = `${prefix}pexip-agent-pin`,
  PexipAppPrefix = `${prefix}pexip-app-prefix`
}
