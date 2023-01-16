import React, { createRef } from 'react'
import config from './config.js'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bars } from 'react-loader-spinner'

import {
  createInfinityClient,
  createInfinityClientSignals,
  createCallSignals,
  InfinityClient,
  InfinitySignals,
  CallSignals,
  PresoConnectionChangeEvent,
  Participant
} from '@pexip/infinity'

import { Toolbar } from './toolbar/Toolbar'
import { Video } from './video/Video'
import { Selfview } from './selfview/Selfview'

import * as GenesysUtil from './genesys/genesysService'
import {
  getLocalStream, stopStream
} from './media/media'
import { getCurrentEffect, getProcessedStream, stopProcessedStream } from './media/processor'
import { StreamQuality } from '@pexip/media-components'
import { convertToBandwidth, setStreamQuality, getStreamQuality } from './media/quality'

import './App.scss'
import { ErrorPanel } from './error-panel/ErrorPanel'
import { WithTranslation, withTranslation } from 'react-i18next'

enum CONNECTION_STATE {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  NO_ACTIVE_CALL,
  ERROR,
}

interface ErrorInfo {
  title: string
  message: string
}

interface AppProps extends WithTranslation {
  t: any
}

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
  connectionState: CONNECTION_STATE
  secondaryVideo: 'remote' | 'presentation'
  displayName: string
  isCameraMuted: boolean
  error: ErrorInfo | null
}

export interface InfinityContext {
  conferencePin: string
  conferenceAlias: string
  infinityHost: string
}

class App extends React.Component<AppProps, AppState> {
  private readonly toolbarRef = React.createRef<Toolbar>()

  private infinitySignals!: InfinitySignals
  private callSignals!: CallSignals
  private infinityClient!: InfinityClient
  private infinityContext!: InfinityContext

  constructor (props: AppProps) {
    super(props)
    this.state = {
      localStream: new MediaStream(),
      remoteStream: new MediaStream(),
      presentationStream: new MediaStream(),
      connectionState: CONNECTION_STATE.CONNECTING,
      secondaryVideo: 'presentation',
      displayName: 'Agent',
      isCameraMuted: false,
      error: null
    }
    window.addEventListener('beforeunload', () => {
      this.infinityClient.disconnect({}).catch(null)
    })
    this.handleLocalPresentationStream = this.handleLocalPresentationStream.bind(this)
    this.handleLocalStream = this.handleLocalStream.bind(this)
    this.toggleCameraMute = this.toggleCameraMute.bind(this)
    this.handleChangeStreamQuality = this.handleChangeStreamQuality.bind(this)
  }

  private async checkCameraAccess (): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    if (devices.filter((device) => device.kind === 'videoinput').length === 0) {
      this.setState({
        error: {
          title: this.props.t('errors.camera_not_connected.title', 'Camera not connected'),
          message: this.props.t('errors.camera_not_connected.message', 'You are connected with audio, but a camera is not detected. Connect a camera and push "Try again". If the issue persist, contact the IT department.')
        }
      })
    }
  }

  private handleLocalPresentationStream (presentationStream: MediaStream): void {
    this.setState({
      presentationStream,
      secondaryVideo: 'presentation'
    })
  }

  private handleLocalStream (localStream: MediaStream): void {
    if (this.state.localStream != null) {
      stopProcessedStream(this.state.localStream.id)
      stopStream(this.state.localStream)
    }
    this.state.localStream.getTracks().forEach((track) => track.stop())
    this.infinityClient.setStream(localStream)
    this.setState({ localStream })
  }

  private async toggleCameraMute (value?: boolean): Promise<void> {
    let muted = this.state.isCameraMuted
    if (value != null) muted = !value
    const response = await this.infinityClient.muteVideo({ muteVideo: !muted })
    if (response?.status === 200) {
      if (this.state.localStream != null) {
        stopProcessedStream(this.state.localStream.id)
        stopStream(this.state.localStream)
      }
      if (muted) {
        let localStream = await getLocalStream()
        localStream = await getProcessedStream(localStream, getCurrentEffect())
        this.setState({
          localStream
        })
        this.infinityClient.setStream(localStream)
      }
      this.infinityClient.setStream(new MediaStream())
      this.setState({ isCameraMuted: !muted })
    }
  }

  private configureSignals (): void {
    this.infinitySignals = createInfinityClientSignals([])
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
    // Disconnect the playback service when connected
    const checkPlaybackDisconnection = async (participant: Participant): Promise<void> => {
      if (participant.uri.match(/^sip:.*\.playback@/) != null) {
        await this.infinityClient.kick({ participantUuid: participant.uuid })
        this.infinitySignals.onParticipantJoined.remove(checkPlaybackDisconnection)
      }
    }
    this.infinitySignals.onParticipantJoined.add(checkPlaybackDisconnection)
  }

  private async joinConference (
    node: string,
    conferenceAlias: string,
    mediaStream: MediaStream,
    displayName: string,
    pin: string
  ): Promise<void> {
    this.configureSignals()
    this.infinityClient = createInfinityClient(this.infinitySignals, this.callSignals)
    const streamQuality = getStreamQuality()
    const bandwidth = convertToBandwidth(streamQuality)
    try {
      await this.infinityClient.call({
        node,
        conferenceAlias,
        mediaStream,
        displayName,
        bandwidth,
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
    await this.checkCameraAccess()
    const queryParams = new URLSearchParams(window.location.search)
    const pcEnvironment = queryParams.get('pcEnvironment')
    const pcConversationId = queryParams.get('pcConversationId') ?? ''
    const pexipNode = queryParams.get('pexipNode') ?? ''
    const pexipAgentPin = queryParams.get('pexipAgentPin') ?? ''
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
      // Initiate Genesys enviroment
      await GenesysUtil.initialize(state, accessToken)

      // Stopp the initiliasation if no call is active
      const callstate = await GenesysUtil.isCallActive() || false
      if (!callstate) {
        this.setState({ connectionState: CONNECTION_STATE.NO_ACTIVE_CALL })
        return
      } else {
        if (this.state.error != null) {
          this.setState({ connectionState: CONNECTION_STATE.ERROR })
        }
      }
      const pexipNode = state.pexipNode
      const pexipAgentPin = state.pexipAgentPin
      await GenesysUtil.initialize(state, accessToken)
      // Add on hold listener
      GenesysUtil.addHoldListener(
        async (mute) => await this.onHoldVideo(mute)
      )
      // Add end call listener
      GenesysUtil.addEndCallListener(async () => await this.onEndCall())
      const aniName = (await GenesysUtil.fetchAniName()) ?? ''

      // Add end call listener
      GenesysUtil.addMuteListener(
        async (mute) => await this.onMuteCall(mute)
      )
      const prefixedConfAlias = config.pexip.conferencePrefix + aniName
      this.infinityContext = { conferencePin: pexipAgentPin, conferenceAlias: aniName, infinityHost: pexipNode }

      let localStream: MediaStream = new MediaStream()
      try {
        localStream = await getLocalStream()
      } catch (err) {
        const error: ErrorInfo = {
          title: this.props.t('errors.camera_permission_denied.title', 'Camera access denied'),
          message: this.props.t('errors.camera_permission_denied.message', 'You are connected with audio, but the permission to the camera wasn’t granted. Go to the browser configuration, grant the permission and push on "Try again". If the issue persist, contact the IT department.')
        }
        this.setState({ error, connectionState: CONNECTION_STATE.ERROR })
        return
      }
      localStream = await getProcessedStream(localStream)
      const displayName = await GenesysUtil.fetchAgentName()

      this.setState({
        localStream,
        displayName
      })

      await this.joinConference(
        pexipNode,
        prefixedConfAlias,
        localStream,
        displayName,
        pexipAgentPin
      )
      // Set inital context for hold and mute
      const holdState = await GenesysUtil.isHold()
      const muteState = await GenesysUtil.isMuted()
      await this.onMuteCall(muteState)
      await this.onHoldVideo(holdState)
      const participantList = this.infinityClient.participants
      // Set the role of all particpants to guest except agent and sip call
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      participantList.filter(participant => participant.uuid !== this.infinityClient.me?.uuid).filter(participant => participant.callType !== 'audio').forEach(async participant => await this.infinityClient.setRole({ role: 'guest', participantUuid: participant.uuid }))
    }
  }

  // Set the video to mute for all participants
  async onHoldVideo (onHold: boolean): Promise<void> {
    const participantList = this.infinityClient.participants
    // Mute current user video and set mute adio indicator even if no audio layer is used by web rtc
    await this.infinityClient.muteVideo({ muteVideo: onHold })
    await this.infinityClient.mute({ mute: await GenesysUtil.isMuted() || onHold })
    // Mute other participants video
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    participantList.forEach(async participant => await this.infinityClient.muteVideo({ muteVideo: onHold, participantUuid: participant.uuid }))
    await this.toggleCameraMute(onHold)
    if (onHold) {
      await this.toolbarRef?.current?.stoppScreenShare()
    }
  }

  //
  async onEndCall (): Promise<void> {
    await this.infinityClient.disconnectAll({})
    await this.infinityClient.disconnect({})
    this.setState({ connectionState: CONNECTION_STATE.NO_ACTIVE_CALL })
  }

  async onMuteCall (muted: boolean): Promise<void> {
    await this.infinityClient.mute({ mute: muted })
  }

  handleChangeStreamQuality (streamQuality: StreamQuality): void {
    this.infinityClient.setBandwidth(convertToBandwidth(streamQuality))
    setStreamQuality(streamQuality)
  }

  async componentWillUnmount (): Promise<void> {
    if (this.state.localStream != null) {
      stopProcessedStream(this.state.localStream.id)
      stopStream(this.state.localStream)
    }
    await this.infinityClient?.disconnect({})
  }

  render (): JSX.Element {
    const appRef = createRef<HTMLDivElement>()
    return (
      <div className='App' data-testid='App' ref={appRef}>
        { this.state.error != null && this.state.connectionState === CONNECTION_STATE.ERROR &&
          <ErrorPanel title={this.state.error.title} message={this.state.error.message}
            onClick={() => {
              this.setState({ error: null, connectionState: CONNECTION_STATE.CONNECTING })
              this.componentDidMount().catch((error) => console.error(error))
            }}></ErrorPanel>}
        <Bars height="100" width="100" color="#FFFFFF" ariaLabel="app loading" wrapperStyle={{}} wrapperClass="wrapper-class" visible={this.state.connectionState === CONNECTION_STATE.CONNECTING} />
         {this.state.connectionState === CONNECTION_STATE.NO_ACTIVE_CALL &&
            <div className="no-active-call">
              <h1>No active call</h1>
            </div>
         }
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
            { this.state.localStream.active &&
              <Selfview
                floatRoot={appRef}
                callSignals={this.callSignals}
                username={this.state.displayName}
                localStream={this.state.localStream}
              />
            }
            <Toolbar ref={this.toolbarRef}
              infinityClient={this.infinityClient}
              infinityContext = {this.infinityContext}
              callSignals={this.callSignals}
              infinitySignals={this.infinitySignals}
              onLocalPresentationStream={this.handleLocalPresentationStream}
              onLocalStream={this.handleLocalStream}
              isCameraMuted={this.state.isCameraMuted}
              onCameraMute={this.toggleCameraMute}
              onChangeStreamQuality={this.handleChangeStreamQuality}
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

export default withTranslation()(App)
