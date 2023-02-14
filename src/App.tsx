import React, { createRef } from 'react'
import config from './config.js'
import { ToastContainer, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
import { CenterLayout, Spinner } from '@pexip/components'
import { StreamQuality } from '@pexip/media-components'
import { convertToBandwidth, setStreamQuality, getStreamQuality } from './media/quality'

import { ErrorPanel } from './error-panel/ErrorPanel'
import ERROR_ID from './constants/error-ids'

import './App.scss'

enum CONNECTION_STATE {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  NO_ACTIVE_CALL,
  ERROR,
}

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
  connectionState: CONNECTION_STATE
  secondaryVideo: 'remote' | 'presentation'
  displayName: string
  isCameraMuted: boolean
  errorId: string
}

export interface InfinityContext {
  conferencePin: string
  conferenceAlias: string
  infinityHost: string
}

class App extends React.Component<{}, AppState> {
  private readonly toolbarRef = React.createRef<Toolbar>()

  private infinitySignals!: InfinitySignals
  private callSignals!: CallSignals
  private infinityClient!: InfinityClient
  private infinityContext!: InfinityContext

  private readonly appRef = createRef<HTMLDivElement>()

  constructor (props: {}) {
    super(props)
    this.state = {
      localStream: new MediaStream(),
      remoteStream: new MediaStream(),
      presentationStream: new MediaStream(),
      connectionState: CONNECTION_STATE.DISCONNECTED,
      secondaryVideo: 'presentation',
      displayName: 'Agent',
      isCameraMuted: false,
      errorId: ''
    }
    window.addEventListener('beforeunload', () => {
      this.infinityClient?.disconnect({}).catch(null)
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
        errorId: ERROR_ID.CAMERA_NOT_CONNECTED,
        connectionState: CONNECTION_STATE.ERROR
      })
      throw new Error('Camera not connected')
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
    if (value === muted) {
      return
    }
    if (value != null) {
      muted = !value
    }
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
    const response = await this.infinityClient.call({
      node,
      conferenceAlias,
      mediaStream,
      displayName,
      bandwidth,
      pin
    })
    if (response != null) {
      switch (response.status) {
        case 403: {
          this.setState({
            errorId: ERROR_ID.CONFERENCE_AUTHENTICATION_FAILED,
            connectionState: CONNECTION_STATE.ERROR
          })
          break
        }
        case 404: {
          this.setState({
            errorId: ERROR_ID.CONFERENCE_NOT_FOUND,
            connectionState: CONNECTION_STATE.ERROR
          })
          break
        }
        default: {
          this.setState({ connectionState: CONNECTION_STATE.CONNECTED })
          // toast('Connected!')
          break
        }
      }
    } else {
      this.setState({
        errorId: ERROR_ID.INFINITY_SERVER_UNAVAILABLE,
        connectionState: CONNECTION_STATE.ERROR
      })
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
    try { await this.checkCameraAccess() } catch (error) { return }
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
      this.setState({ connectionState: CONNECTION_STATE.CONNECTING })
      const parsedUrl = new URL(window.location.href.replace(/#/g, '?'))
      const queryParams = new URLSearchParams(parsedUrl.search)
      const accessToken = queryParams.get('access_token') as string
      const state = JSON.parse(
        decodeURIComponent(queryParams.get('state') as string)
      )
      // Initiate Genesys enviroment
      await GenesysUtil.initialize(state, accessToken)

      // Stop the initialization if no call is active
      const callstate = await GenesysUtil.isCallActive() || false
      if (!callstate) {
        this.setState({ connectionState: CONNECTION_STATE.NO_ACTIVE_CALL })
        return
      }
      const pexipNode = state.pexipNode
      const pexipAgentPin = state.pexipAgentPin
      await GenesysUtil.initialize(state, accessToken)
      // Add on hold listener
      GenesysUtil.addHoldListener(
        async (mute) => await this.onHoldVideo(mute)
      )
      // Add end call listener
      GenesysUtil.addEndCallListener(async (disconnectAll: boolean) => await this.onEndCall(disconnectAll))
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
        this.setState({
          errorId: ERROR_ID.CAMERA_ACCESS_DENIED,
          connectionState: CONNECTION_STATE.ERROR
        })
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
      // Set initial context for hold and mute
      const holdState = await GenesysUtil.isHold()
      const muteState = await GenesysUtil.isMuted()
      await this.onMuteCall(muteState)
      await this.onHoldVideo(holdState)
    }
  }

  // Set the video to mute for all participants
  async onHoldVideo (onHold: boolean): Promise<void> {
    const participantList = this.infinityClient.participants
    // Mute current user video and set mute audio indicator even if no audio layer is used by web rtc
    await this.toggleCameraMute(onHold)
    await this.infinityClient.mute({ mute: await GenesysUtil.isMuted() || onHold })
    // Mute other participants video
    participantList.forEach((participant) => {
      this.infinityClient.muteVideo({ muteVideo: onHold, participantUuid: participant.uuid })
        .catch((error) => console.error(error))
    })
    if (onHold) {
      await this.toolbarRef?.current?.stopScreenShare()
    }
  }

  async onEndCall (disconnectAll: boolean): Promise<void> {
    if (disconnectAll) {
      await this.infinityClient.disconnectAll({})
    }
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
    if (this.state.connectionState === CONNECTION_STATE.DISCONNECTED) {
      return <></>
    }
    return (
      <div className='App' data-testid='App' ref={this.appRef}>
        { this.state.errorId !== '' && this.state.connectionState === CONNECTION_STATE.ERROR &&
          <ErrorPanel errorId={this.state.errorId}
            onClick={() => {
              this.setState({ errorId: '', connectionState: CONNECTION_STATE.CONNECTING })
              this.componentDidMount().catch((error) => console.error(error))
            }}></ErrorPanel>}
          { (this.state.connectionState === CONNECTION_STATE.CONNECTING ||
            this.state.connectionState === CONNECTION_STATE.CONNECTED) &&
            <CenterLayout className='loading-spinner'>
              <Spinner colorScheme='light'/>
            </CenterLayout>
          }
         { this.state.connectionState === CONNECTION_STATE.NO_ACTIVE_CALL &&
            <div className="no-active-call">
              <h1>No active call</h1>
            </div>
         }
        { this.state.connectionState === CONNECTION_STATE.CONNECTED && (
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
            { this.state.presentationStream.active && (
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
                floatRoot={this.appRef}
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

export default App
