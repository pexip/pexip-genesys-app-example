import { useEffect, useRef, useState } from 'react'
import { ToastContainer, Slide } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import {
  createInfinityClient,
  createInfinityClientSignals,
  createCallSignals,
  type InfinityClient,
  type InfinitySignals,
  type CallSignals,
  type PresoConnectionChangeEvent,
  ClientCallType
} from '@pexip/infinity'
import { CenterLayout, Spinner, Video } from '@pexip/components'
import { type StreamQuality } from '@pexip/media-components'
import {
  convertToBandwidth,
  setStreamQuality,
  getStreamQuality
} from './media/quality'
import { getLocalStream, stopStream } from './media/media'
import * as GenesysService from './genesys/genesysService'
import { ErrorPanel } from './error-panel/ErrorPanel'
import ERROR_ID from './constants/error-ids'
import { ConnectionState } from './types/ConnectionState'
import { Toolbar } from './toolbar/Toolbar'
import { Selfview } from './selfview/Selfview'

import './App.scss'

let infinitySignals: InfinitySignals
let callSignals: CallSignals
let infinityClient: InfinityClient

let pexipNode: string
let pexipAgentPin: string
let pexipAppPrefix: string = 'agent'
let aniName: string
let conferenceAlias: string

export const App = (): JSX.Element => {
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const [presentationStream, setPresentationStream] = useState<MediaStream>()

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Connecting
  )
  const [secondaryVideo, setSecondaryVideo] = useState<
    'remote' | 'presentation'
  >('presentation')

  const [displayName, setDisplayName] = useState<string>('Agent')

  const [errorId, setErrorId] = useState<string>('')

  const appRef = useRef<HTMLDivElement>(null)

  const checkCameraAccess = async (): Promise<void> => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    if (devices.filter((device) => device.kind === 'videoinput').length === 0) {
      setErrorId(ERROR_ID.CAMERA_NOT_CONNECTED)
      setConnectionState(ConnectionState.Error)
      throw new Error('Camera not connected')
    }
  }

  const handleLocalPresentationStream = (
    presentationStream: MediaStream
  ): void => {
    setPresentationStream(presentationStream)
    setSecondaryVideo('presentation')
  }

  const handleLocalStream = (stream: MediaStream): void => {
    if (localStream != null) {
      stopStream(localStream)
    }
    infinityClient.setStream(stream)
    setLocalStream(stream)
  }

  const toggleCameraMute = async (muted: boolean): Promise<void> => {
    const response = await infinityClient.muteVideo({ muteVideo: !muted })
    if (response?.status === 200) {
      if (localStream != null) {
        stopStream(localStream)
      }
      if (muted) {
        let localStream = await getLocalStream()
        infinityClient.setStream(localStream)
      } else {
        infinityClient.setStream(new MediaStream())
      }
    }
  }

  const configureSignals = () => {
    infinitySignals = createInfinityClientSignals([])
    callSignals = createCallSignals([])
    callSignals.onRemoteStream.add((remoteStream) => {
      setRemoteStream(remoteStream)
    })
    callSignals.onRemotePresentationStream.add((presentationStream) => {
      setPresentationStream(presentationStream)
      setSecondaryVideo('remote')
    })
    callSignals.onPresentationConnectionChange.add(
      (changeEvent: PresoConnectionChangeEvent) => {
        if (
          changeEvent.recv !== 'connected' &&
          changeEvent.send !== 'connected'
        ) {
          setPresentationStream(new MediaStream())
          setSecondaryVideo('presentation')
        }
      }
    )
    // Disconnect the playback service when connected
    // const checkPlaybackDisconnection = async (
    //   participant: Participant
    // ): Promise<void> => {
    //   if (participant.uri.match(/^sip:.*\.playback@/) != null) {
    //     await this.infinityClient.kick({ participantUuid: participant.uuid })
    //     // this.infinitySignals.onParticipantJoined.remove(
    //     //   checkPlaybackDisconnection
    //     // )
    //   }
    // }
    // this.infinitySignals.onParticipantJoined.add(checkPlaybackDisconnection)

    /**
     * Check if the agent should be disconnected. This should happen after the last
     * customer participant leaves. We check if the callType is api, because the
     * agent is connected first as api and later it changes to video.
     */
    // const checkIfDisconnect = async (): Promise<void> => {
    //   // const videoParticipants = this.infinityClient.participants.filter(
    //   //   (participant) => {
    //   //     return (
    //   //       participant.callType === CallType.video ||
    //   //       participant.callType === CallType.api
    //   //     )
    //   //   }
    //   // )
    //   // if (videoParticipants.length === 1) await this.onEndCall(true)
    // }
    // this.infinitySignals.onParticipantLeft.add(checkIfDisconnect)
  }

  const joinConference = async (
    node: string,
    conferenceAlias: string,
    mediaStream: MediaStream,
    displayName: string,
    pin: string
  ): Promise<void> => {
    configureSignals()
    infinityClient = createInfinityClient(infinitySignals, callSignals)
    const streamQuality = getStreamQuality()
    const bandwidth = convertToBandwidth(streamQuality)
    const response = await infinityClient.call({
      node,
      conferenceAlias,
      mediaStream,
      displayName,
      bandwidth,
      pin,
      callType: ClientCallType.Video
    })
    if (response != null) {
      switch (response.status) {
        case 403: {
          setErrorId(ERROR_ID.CONFERENCE_AUTHENTICATION_FAILED)
          setConnectionState(ConnectionState.Error)
          break
        }
        case 404: {
          setErrorId(ERROR_ID.CONFERENCE_NOT_FOUND)
          setConnectionState(ConnectionState.Error)
          break
        }
        default: {
          setConnectionState(ConnectionState.Connected)
          break
        }
      }
    } else {
      setErrorId(ERROR_ID.INFINITY_SERVER_UNAVAILABLE)
      setConnectionState(ConnectionState.Error)
    }
  }

  const exchangeVideos = () => {
    if (secondaryVideo === 'presentation') {
      setSecondaryVideo('remote')
    } else {
      setSecondaryVideo('presentation')
    }
  }

  /**
   * Initiates a conference based on the global fields pexipNode and pexipAgentPin.
   * The local media stream will be initiated in this method.
   * The method relies on GenesysService to get the conference alias and the agents display name
   */
  const initConference = async (): Promise<void> => {
    const prefixedConfAlias = pexipAppPrefix + conferenceAlias
    let localStream: MediaStream = new MediaStream()
    try {
      localStream = await getLocalStream()
    } catch (err) {
      setErrorId(ERROR_ID.CAMERA_ACCESS_DENIED)
      setConnectionState(ConnectionState.Error)
      return
    }
    const displayName = GenesysService.getAgentName()

    setLocalStream(localStream)
    setDisplayName(displayName)

    await joinConference(
      pexipNode,
      prefixedConfAlias,
      localStream,
      displayName,
      pexipAgentPin
    )

    // Set initial context for hold and mute
    const holdState = await GenesysService.isHeld()
    const muteState = await GenesysService.isMuted()
    await onMuteCall(muteState)
    await onHoldVideo(holdState)
  }

  // Set the video to mute for all participants
  const onHoldVideo = async (onHold: boolean): Promise<void> => {
    const participantList: any[] = []
    // const participantList = this.infinityClient.participants
    // Mute current user video and set mute audio indicator even if no audio layer is used by web rtc
    await toggleCameraMute(onHold)
    await infinityClient.mute({
      mute: (await GenesysService.isMuted()) || onHold
    })
    // Mute other participants video
    participantList.forEach((participant) => {
      infinityClient
        .muteVideo({ muteVideo: onHold, participantUuid: participant.uuid })
        .catch(console.error)
    })
    // if (onHold) {
    //   await this.toolbarRef?.current?.stopScreenShare()
    // }
  }

  const onEndCall = async (shouldDisconnectAll: boolean): Promise<void> => {
    if (localStream != null) {
      stopStream(localStream)
    }
    if (shouldDisconnectAll) {
      await infinityClient.disconnectAll({})
    }
    await infinityClient?.disconnect({})
    setConnectionState(ConnectionState.Disconnected)
  }

  const onMuteCall = async (muted: boolean): Promise<void> => {
    await infinityClient.mute({ mute: muted })
  }

  const handleChangeStreamQuality = (streamQuality: StreamQuality) => {
    infinityClient.setBandwidth(convertToBandwidth(streamQuality))
    setStreamQuality(streamQuality)
  }

  const initializeGenesys = async (state: any, accessToken: string) => {
    // Initiate Genesys environment
    await GenesysService.initialize(state, accessToken)

    // Stop the initialization if no call is active
    const callActive = (await GenesysService.isCallActive()) || false
    if (!callActive) {
      setConnectionState(ConnectionState.Disconnected)
      return
    }

    pexipNode = state.pexipNode
    pexipAgentPin = state.pexipAgentPin
    aniName = (await GenesysService.fetchAniName()) ?? ''
    pexipAppPrefix = state.pexipAppPrefix
    conferenceAlias = (await GenesysService.isDialOut(pexipNode))
      ? aniName
      : uuidv4()

    // Add on hold listener
    GenesysService.addHoldListener(async (mute) => await onHoldVideo(mute))

    // Add end call listener
    GenesysService.addEndCallListener(
      async (shouldDisconnectAll: boolean) =>
        await onEndCall(shouldDisconnectAll)
    )

    // Add connect call listener
    GenesysService.addConnectCallListener(async () => {
      if (connectionState === ConnectionState.Disconnected) {
        setConnectionState(ConnectionState.Connecting)
        await initConference()
      }
    })

    // Add connect call listener
    GenesysService.addMuteListener(async (mute) => await onMuteCall(mute))
  }

  useEffect(() => {
    try {
      checkCameraAccess().catch(console.error)
    } catch (error) {
      return
    }
    const queryParams = new URLSearchParams(window.location.search)

    const pcEnvironment = queryParams.get('pcEnvironment') ?? ''
    const pcConversationId = queryParams.get('pcConversationId') ?? ''

    pexipNode = queryParams.get('pexipNode') ?? ''
    pexipAgentPin = queryParams.get('pexipAgentPin') ?? ''
    pexipAppPrefix = queryParams.get('pexipAppPrefix') ?? ''

    if (
      pcEnvironment != '' &&
      pcConversationId != '' &&
      pexipNode != '' &&
      pexipAgentPin != '' &&
      pexipAppPrefix != ''
    ) {
      GenesysService.loginPureCloud(
        pcEnvironment,
        pcConversationId,
        pexipNode,
        pexipAgentPin,
        pexipAppPrefix
      )
    } else {
      // Logged into Genesys
      setConnectionState(ConnectionState.Connecting)

      const parsedUrl = new URL(window.location.href.replace(/#/g, '?'))
      const queryParams = new URLSearchParams(parsedUrl.search)

      const accessToken = queryParams.get('access_token') as string
      const state = JSON.parse(
        decodeURIComponent(queryParams.get('state') as string)
      )

      initializeGenesys(state, accessToken)
        .then(() => {
          initConference().catch(console.error)
        })
        .catch(console.error)
    }

    const handleDisconnect = () => {
      infinityClient?.disconnect({})
    }

    window.addEventListener('beforeunload', handleDisconnect)
    return () => {
      window.removeEventListener('beforeunload', handleDisconnect)
      onEndCall(false)
    }
  }, [])

  return (
    <div className="App" data-testid="App" ref={appRef}>
      {errorId !== '' && connectionState === ConnectionState.Error && (
        <ErrorPanel
          errorId={errorId}
          onClick={() => {
            setErrorId('')
            setConnectionState(ConnectionState.Connecting)
            // this.componentDidMount().catch((error) => console.error(error))
          }}
        ></ErrorPanel>
      )}

      {(connectionState === ConnectionState.Connecting ||
        connectionState === ConnectionState.Connected) && (
        <CenterLayout className="loading-spinner">
          <Spinner colorScheme="light" />
        </CenterLayout>
      )}

      {connectionState === ConnectionState.Disconnected && (
        <div className="no-active-call" data-testid="no-active-call">
          <h1>No active call</h1>
        </div>
      )}

      {connectionState === ConnectionState.Connected && (
        <>
          <Video
            id="remoteVideo"
            srcObject={remoteStream}
            className={secondaryVideo === 'remote' ? 'secondary' : 'primary'}
            onClick={secondaryVideo === 'remote' ? exchangeVideos : undefined}
          />

          {presentationStream != null && (
            <Video
              srcObject={presentationStream}
              style={{ objectFit: 'contain' }}
              className={
                secondaryVideo === 'presentation' ? 'secondary' : 'primary'
              }
              onClick={
                secondaryVideo === 'presentation' ? exchangeVideos : undefined
              }
            />
          )}

          {localStream != null && (
            <Selfview
              floatRoot={appRef}
              callSignals={callSignals}
              username={displayName}
              localStream={localStream}
            />
          )}

          <Toolbar
            infinityClient={infinityClient}
            callSignals={callSignals}
            infinitySignals={infinitySignals}
            pexipNode={pexipNode}
            pexipAppPrefix={pexipAppPrefix}
            conferenceAlias={conferenceAlias}
            onCameraMute={toggleCameraMute}
            onLocalPresentationStream={handleLocalPresentationStream}
            onLocalStream={handleLocalStream}
            onChangeStreamQuality={handleChangeStreamQuality}
          />
        </>
      )}

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
