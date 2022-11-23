import React from 'react'

import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  createInfinityClient,
  createInfinityClientSignals,
  createCallSignals,
  InfinityClient,
  InfinitySignals,
  CallSignals,
  PresoConnectionChangeEvent
} from '@pexip/infinity'

import { Video } from './video/Video'
import { Toolbar } from './toolbar/Toolbar'

import './App.scss'

import Draggable from 'react-draggable'
import { loginPureCloud, setAccessTokenPureCloud } from './genesys'

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
  private readonly selfViewRef = React.createRef<HTMLDivElement>()
  private readonly remoteVideoRef = React.createRef<HTMLVideoElement>()

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
    window.addEventListener('beforeunload', () => { this.infinityClient.disconnect({}).catch(null) })
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
    this.setState({
      presentationStream,
      secondaryVideo: 'presentation'
    })
  }

  private configureSignals (): void {
    this.signals = createInfinityClientSignals([])
    this.callSignals = createCallSignals([])
    this.callSignals.onRemoteStream.add((remoteStream) => {
      this.setState({ remoteStream })
    })
    this.callSignals.onRemotePresentationStream.add((presentationStream) => {
      this.setState({
        presentationStream,
        secondaryVideo: 'remote'
      })
    })
    this.callSignals.onPresentationConnectionChange.add((changeEvent: PresoConnectionChangeEvent) => {
      if (changeEvent.recv !== 'connected' && changeEvent.send !== 'connected') {
        this.setState({
          presentationStream: new MediaStream(),
          secondaryVideo: 'presentation'
        })
      }
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
      toast('Connected!')
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
    const queryParams = new URLSearchParams(window.location.search)
    const pcEnvironment = queryParams.get('pcEnvironment')
    const pcConversationId = queryParams.get('pcConversationId')
    const pexipNode = queryParams.get('pexipNode')
    const pexipAgentPin = queryParams.get('pexipAgentPin')
    const displayName = 'Agent'
    console.log(window.location.href)
    if (pcEnvironment != null && pcConversationId != null && pexipNode != null && pexipAgentPin != null) {
      // throw Error('Some of the parameters are not defined in the URL in the query string.\n' +
      //   'You have to define "pcEnvironment", "pcConversationId", "pexipNode" and "pexipAgentPin"')
      await loginPureCloud(pcEnvironment, pcConversationId, pexipNode, pexipAgentPin)
    } else {
      const parsedUrl = new URL(window.location.href.replace(/#/g, '?'))
      const queryParams = new URLSearchParams(parsedUrl.search)
      const accessToken = queryParams.get('access_token') as string
      console.log(accessToken)
      const state = JSON.parse(decodeURIComponent(queryParams.get('state') as string))
      const pexipNode = state.pexipNode
      const pcConversationId = state.pcConversationId
      const pexipAgentPin = state.pexipAgentPin
      await setAccessTokenPureCloud(accessToken)
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true })
      this.setState({ localStream })
      await this.joinConference(pexipNode, pcConversationId, localStream, displayName, pexipAgentPin)
    }
  }

  async componentWillUnmount (): Promise<void> {
    await this.infinityClient.disconnect({})
  }

  render (): JSX.Element {
    return (
      <div className="App" data-testid='App'>
        { this.state.connectionState === CONNECTION_STATE.CONNECTED &&
          <>
            <Video mediaStream={this.state.remoteStream} id='remoteVideo'
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
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover
          theme="light"
          transition={Slide}
        />
      </div>
    )
  }
}

export default App
