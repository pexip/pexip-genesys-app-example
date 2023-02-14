// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class GenesysDisconnectType {
  // More values are used by Genesys
  // Valid values: endpoint, client, system, transfer, transfer.conference, transfer.consult, transfer.forward, transfer.noanswer, transfer.notavailable, transport.failure, error, peer, other, spam.
  public static readonly PEER = 'peer'
  public static readonly CLIENT = 'client'
  public static readonly TRANSFER = 'transfer'
}
