import React from 'react'

import {
  createInfinityClient,
  createInfinityClientSignals,
  createCallSignals,
  InfinityClient,
  InfinitySignals,
  CallSignals
} from '@pexip/infinity'

import { Video } from './video/Video'
import { Toolbar } from './toolbar/Toolbar'

import './App.scss'

import Draggable from 'react-draggable'

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
}

class App extends React.Component<{}, AppState> {
  // TODO: We should receive the following information in the query parameters:
  //  - pcEnvironment (Genesys Cloud Region)
  //  - pcConversationId
  //  - PexipNodeUrl
  //  - PexipAgentPin

  private readonly selfViewRef = React.createRef<HTMLDivElement>()

  private signals!: InfinitySignals
  private callSignals!: CallSignals
  private infinityClient!: InfinityClient

  constructor (props: {}) {
    super(props)
    this.state = {
      localStream: new MediaStream(),
      remoteStream: new MediaStream(),
      presentationStream: new MediaStream()
    }
    // Workaround for maintain the selfView in the viewport when resizing
    window.addEventListener('resize', () => this.simulateSelfViewClick())
  }

  // Workaround for maintain the selfView in the viewport when resizing
  private simulateSelfViewClick (): void {
    this.selfViewRef.current?.dispatchEvent(new Event('mouseover', { bubbles: true }))
    this.selfViewRef.current?.dispatchEvent(new Event('mousedown', { bubbles: true }))
    setTimeout(() => {
      this.selfViewRef.current?.dispatchEvent(new Event('mousemove', { bubbles: true }))
      this.selfViewRef.current?.dispatchEvent(new Event('mouseup', { bubbles: true }))
    }, 100)
  }

  private configureSignals (): void {
    this.signals = createInfinityClientSignals([])
    this.signals.onError.add((error) => {
      console.error(error)
    })
    this.callSignals = createCallSignals([])
    this.callSignals.onRemoteStream.add((remoteStream) => {
      this.setState({ remoteStream })
    })
  }

  private async joinConference (node: string, conferenceAlias: string, mediaStream: MediaStream,
    displayName: string, pin: string): Promise<void> {
    this.configureSignals()
    this.infinityClient = createInfinityClient(this.signals, this.callSignals)
    await this.infinityClient.call({
      node,
      conferenceAlias,
      mediaStream,
      displayName,
      bandwidth: 500,
      pin
    })
  }

  async componentDidMount (): Promise<void> {
    // const queryParams = new URLSearchParams(window.location.search)
    // const pcEnvironment = queryParams.get('pcEnvironment')
    // const pcConversationId = queryParams.get('pcConverstationId')
    // const node = queryParams.get('pexipNodeUrl')
    // const pin = queryParams.get('pexipAgentPin')
    // TODO: This parameters should be received by a query parameter inside the URL.
    // This is only for testing.
    const node = '192.168.1.101'
    const conferenceAlias = '10'
    const displayName = 'Marcos'
    const pin = '1234'
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true })
    this.setState({ localStream })
    await this.joinConference(node, conferenceAlias, localStream, displayName, pin)
  }

  async componentWillUnmount (): Promise<void> {
    await this.infinityClient.disconnect({})
  }

  render (): JSX.Element {
    return (
      <div className="App" data-testid='App'>
        <div className="videos-container">
          <Video mediaStream={this.state.remoteStream}/>
          <Video mediaStream={this.state.presentationStream} objectFit='contain' />
        </div>
        <Draggable bounds='parent'>
          <div className='self-view' ref={this.selfViewRef}>
            <Video mediaStream={this.state.localStream} flip={true}/>
          </div>
        </Draggable>
        <Toolbar infinityClient={this.infinityClient}/>
      </div>
    )
  }
}

export default App
