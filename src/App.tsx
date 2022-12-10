import React from 'react'
import config from './config.js'
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

// import { Video } from './video/Video'
import { Toolbar } from './toolbar/Toolbar'

import './App.scss'
import { Video } from './video/Video'
import Draggable from 'react-draggable'
import * as GenesysUtil from './genesys/genesysService'

// import Draggable from 'react-draggable'

enum CONNECTION_STATE {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  ERROR,
}

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
  connectionState: CONNECTION_STATE
  secondaryVideo: 'remote' | 'presentation'
}

export interface InfinityContext {
  conferencePin: string
  conferenceAlias: string
  infinityHost: string
}

class App extends React.Component<{}, AppState> {
  private readonly selfViewRef = React.createRef<HTMLDivElement>()
  private readonly remoteVideoRef = React.createRef<HTMLVideoElement>()

  private signals!: InfinitySignals
  private callSignals!: CallSignals
  private infinityClient!: InfinityClient
  private infinityContext!: InfinityContext

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
    window.addEventListener('beforeunload', () => {
      this.infinityClient.disconnect({}).catch(null)
    })
  }

  // Workaround for maintain the selfView in the viewport when resizing
  private simulateSelfViewClick (): void {
    this.selfViewRef.current?.dispatchEvent(
      new Event('mouseover', { bubbles: true })
    )
    this.selfViewRef.current?.dispatchEvent(
      new Event('mousedown', { bubbles: true })
    )
    setTimeout(() => {
      this.selfViewRef.current?.dispatchEvent(
        new Event('mousemove', { bubbles: true })
      )
      this.selfViewRef.current?.dispatchEvent(
        new Event('mouseup', { bubbles: true })
      )
    }, 100)
  }

  private handleLocalPresentationStream (presentationStream: MediaStream): void {
    this.setState({
      presentationStream,
      secondaryVideo: 'presentation'
    })
  }

  private handleLocalStream (localStream: MediaStream): void {
    this.state.localStream.getTracks().forEach((track) => track.stop())
    this.infinityClient.setStream(localStream)
    this.setState({ localStream })
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
    this.callSignals.onPresentationConnectionChange.add(
      (changeEvent: PresoConnectionChangeEvent) => {
        if (
          changeEvent.recv !== 'connected' &&
          changeEvent.send !== 'connected'
        ) {
          this.setState({
            presentationStream: new MediaStream(),
            secondaryVideo: 'presentation'
          })
        }
      }
    )
  }

  private async joinConference (
    node: string,
    conferenceAlias: string,
    mediaStream: MediaStream,
    displayName: string,
    pin: string
  ): Promise<void> {
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
    const pcConversationId = queryParams.get('pcConversationId') ?? ''
    const pexipNode = queryParams.get('pexipNode') ?? ''
    const pexipAgentPin = queryParams.get('pexipAgentPin') ?? ''
    console.log(window.location.href)
    if (
      pcEnvironment != null &&
      pcConversationId != null &&
      pexipNode != null &&
      pexipAgentPin != null
    ) {
      // throw Error('Some of the parameters are not defined in the URL in the query string.\n' +
      //   'You have to define "pcEnvironment", "pcConversationId", "pexipNode" and "pexipAgentPin"')
      await GenesysUtil.loginPureCloud(
        pcEnvironment,
        pcConversationId,
        pexipNode,
        pexipAgentPin
      )
    } else {
      const parsedUrl = new URL(window.location.href.replace(/#/g, '?'))
      const queryParams = new URLSearchParams(parsedUrl.search)
      const accessToken = queryParams.get('access_token') as string
      const state = JSON.parse(
        decodeURIComponent(queryParams.get('state') as string)
      )
      const pexipNode = state.pexipNode
      const pexipAgentPin = state.pexipAgentPin
      await GenesysUtil.inititate(state, accessToken)
      // Add on hold listener
      GenesysUtil.addHoldListener(
        async (mute) => await this.onHoldVideo(mute)
      )
      // Add end call listener
      GenesysUtil.addEndCallLister(async () => await this.onEndCall())
      const aniName = (await GenesysUtil.fetchAniName()) ?? ''
      let localStream: MediaStream
      const deviceId = localStorage.getItem('pexipVideoInputId')
      if (deviceId !== null) {
        const device = (await navigator.mediaDevices.enumerateDevices()).find((device) => device.deviceId === deviceId)
        if (device !== null) {
          localStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } })
        } else {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      } else {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      // Add end call listener
      GenesysUtil.addMuteListenr(
        async (mute) => await this.onMuteCall(mute)
      )
      this.setState({ localStream })
      const prefixedConfAlias = config.pexip.conferencePrefix + aniName
      this.infinityContext = { conferencePin: pexipAgentPin, conferenceAlias: aniName, infinityHost: pexipNode }

      // Try to get agents displayname via Genesys API
      const displayName = await GenesysUtil.fetchAgentName()

      await this.joinConference(
        pexipNode,
        prefixedConfAlias,
        localStream,
        displayName,
        pexipAgentPin
      )
    }
  }

  // Set the video to mute for all participants
  async onHoldVideo (onHold: boolean): Promise<void> {
    // Mute current user video and set mute adio indicator even if no audio layer is used by web rtc
    await this.infinityClient.muteVideo({ muteVideo: onHold })
    await this.infinityClient.mute({ mute: GenesysUtil.muteState || onHold })
    await this.infinityClient.muteAllGuests({ mute: onHold })
    // Set selfview hidden or visibel depending on state
    const selfViewWrapper = this.selfViewRef?.current
    if (selfViewWrapper != null) { selfViewWrapper.hidden = onHold }
  }

  //
  async onEndCall (): Promise<void> {
    await this.infinityClient.disconnectAll({})
    await this.infinityClient.disconnect({})
  }

  async onMuteCall (muted: boolean): Promise<void> {
    await this.infinityClient.mute({ mute: muted })
  }

  async componentWillUnmount (): Promise<void> {
    await this.infinityClient.disconnect({})
  }

  render (): JSX.Element {
    return (
      <div className='App' data-testid='App'>
        {this.state.connectionState === CONNECTION_STATE.CONNECTED && (
          <>
            <Video
              mediaStream={this.state.remoteStream}
              id='remoteVideo'
              secondary={this.state.secondaryVideo === 'remote'}
              onClick={
                this.state.secondaryVideo === 'remote'
                  ? this.exchangeVideos.bind(this)
                  : undefined
              }
            />
            {this.state.presentationStream.active && (
              <Video
                mediaStream={this.state.presentationStream}
                objectFit='contain'
                secondary={this.state.secondaryVideo === 'presentation'}
                onClick={
                  this.state.secondaryVideo === 'presentation'
                    ? this.exchangeVideos.bind(this)
                    : undefined
                }
              />
            )}
            <Draggable bounds='parent'>
              <div className='self-view' ref={this.selfViewRef}>
                <Video
                  mediaStream={this.state.localStream}
                  flip={true}
                  objectFit={'cover'}
                  id='selfview'
                />
              </div>
            </Draggable>
            <Toolbar
              infinityClient={this.infinityClient}
              infinityContext = {this.infinityContext}
              callSignals={this.callSignals}
              onLocalPresentationStream={this.handleLocalPresentationStream.bind(this)}
              onLocalStream={this.handleLocalStream.bind(this)}
            />
          </>
        )}
        <ToastContainer
          position='top-center'
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover
          theme='light'
          transition={Slide}
        />
      </div>
    )
  }
}

export default App
