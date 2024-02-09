// Copyright 2024 Pexip AS
//
// SPDX-License-Identifier: Apache-2.0

export enum GenesysDisconnectType {
  // More values are used by Genesys
  // Valid values: endpoint, client, system, transfer, transfer.conference, transfer.consult, transfer.forward, transfer.noanswer, transfer.notavailable, transport.failure, error, peer, other, spam.
  PEER = 'peer',
  CLIENT = 'client',
  TRANSFER = 'transfer'
}
