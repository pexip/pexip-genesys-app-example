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

enum CONNECTION_STATE {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  ERROR
}

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
  connectionState: CONNECTION_STATE
  secondaryVideo: 'remote' | 'presentation'
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
      presentationStream: new MediaStream(),
      connectionState: CONNECTION_STATE.CONNECTING,
      secondaryVideo: 'presentation'
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

  private handleLocalPresentationStream (presentationStream: MediaStream): void {
    this.setState({ presentationStream })
  }

  private configureSignals (): void {
    this.signals = createInfinityClientSignals([])
    this.callSignals = createCallSignals([])
    this.callSignals.onRemoteStream.add((remoteStream) => {
      this.setState({ remoteStream })
    })
    this.callSignals.onRemotePresentationStream.add((presentationStream) => {
      this.setState({ presentationStream })
    })
  }

  private async joinConference (node: string, conferenceAlias: string, mediaStream: MediaStream,
    displayName: string, pin: string): Promise<void> {
    this.configureSignals()
    this.infinityClient = createInfinityClient(this.signals, this.callSignals)
    try {
      await this.infinityClient.call({
        node,
        conferenceAlias,
        mediaStream,
        displayName,
        bandwidth: 500,
        pin
      })
      this.setState({ connectionState: CONNECTION_STATE.CONNECTED })
    } catch (error) {
      this.setState({ connectionState: CONNECTION_STATE.ERROR })
    }
  }

  private exchangeVideos (): void {
    if (this.state.secondaryVideo === 'presentation') {
      this.setState({ secondaryVideo: 'remote' })
    } else {
      this.setState({ secondaryVideo: 'presentation' })
    }
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
        { this.state.connectionState === CONNECTION_STATE.CONNECTED &&
          <>
            <Video mediaStream={this.state.remoteStream}
            secondary={this.state.secondaryVideo === 'remote'}
            onClick={this.state.secondaryVideo === 'remote' ? this.exchangeVideos.bind(this) : undefined} />
            { this.state.presentationStream.active && <Video mediaStream={this.state.presentationStream} objectFit='contain'
              secondary={this.state.secondaryVideo === 'presentation'}
              onClick={this.state.secondaryVideo === 'presentation' ? this.exchangeVideos.bind(this) : undefined} /> }
            <Draggable bounds='parent'>
              <div className='self-view' ref={this.selfViewRef}>
                <Video mediaStream={this.state.localStream} flip={true} objectFit={'cover'}/>
              </div>
            </Draggable>
            <Toolbar infinityClient={this.infinityClient} callSignals={this.callSignals} onLocalPresentationStream={this.handleLocalPresentationStream.bind(this)}/>
          </>
        }
      </div>
    )
  }
}

export default App
