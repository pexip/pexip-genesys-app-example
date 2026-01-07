import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  createInfinityClient,
  createInfinityClientSignals,
  createCallSignals,
  type InfinityClient,
  type InfinitySignals,
  type CallSignals,
  ClientCallType,
  CallType,
  type PresoConnectionChangeEvent
} from '@pexip/infinity'
import {
  CenterLayout,
  NotificationToast,
  notificationToastSignal,
  Spinner,
  Video
} from '@pexip/components'
import { StreamQuality } from '@pexip/media-components'
import { convertToBandwidth } from './media/quality'
import * as GenesysService from './genesys/genesysService'
import { ErrorPanel } from './error-panel/ErrorPanel'
import { ErrorId } from './constants/ErrorId'
import { ConnectionState } from './types/ConnectionState'
import { Toolbar } from './toolbar/Toolbar'
import { SelfView } from './selfview/SelfView'
import { type Settings } from './types/Settings'
import { type MediaDeviceInfoLike } from '@pexip/media-control'
import { Effect } from './types/Effect'
import { type VideoProcessor } from '@pexip/media-processor'
import { getVideoProcessor } from './media/video-processor'
import { LocalStorageKey } from './types/LocalStorageKey'

import './App.scss'

let infinitySignals: InfinitySignals
let callSignals: CallSignals
let infinityClient: InfinityClient

let pexipNode: string
let pexipAgentPin: string
let pexipAppPrefix: string = 'agent'
let conferenceAlias: string
let connectingCallInProgress: boolean = false

let videoProcessor: VideoProcessor

interface GenesysState {
  pcEnvironment: string
  pcConversationId: string
  pexipNode: string
  pexipAgentPin: string
  pexipAppPrefix: string
}

export const App = (): JSX.Element => {
  const [device, setDevice] = useState<MediaDeviceInfoLike>()
  const [effect, setEffect] = useState<Effect>(
    (localStorage.getItem(LocalStorageKey.Effect) as Effect) ?? Effect.None
  )
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(
    (localStorage.getItem(LocalStorageKey.StreamQuality) as StreamQuality) ??
      StreamQuality.High
  )
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [processedStream, setProcessedStream] = useState<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const [presenting, setPresenting] = useState<boolean>(false)
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
      setErrorId(ErrorId.CAMERA_NOT_CONNECTED)
      setConnectionState(ConnectionState.Error)
      throw new Error('Camera not connected')
    }
  }

  const joinConference = async (
    node: string,
    conferenceAlias: string,
    mediaStream: MediaStream,
    displayName: string,
    pin: string
  ): Promise<void> => {
    infinityClient = createInfinityClient(infinitySignals, callSignals)
    const bandwidth = convertToBandwidth(streamQuality)
    const response = await infinityClient.call({
      node,
      conferenceAlias,
      mediaStream,
      displayName,
      bandwidth,
      pin,
      callType: ClientCallType.VideoPresentation
    })

    connectingCallInProgress = false

    if (response != null) {
      switch (response.status) {
        case 403: {
          setErrorId(ErrorId.CONFERENCE_AUTHENTICATION_FAILED)
          setConnectionState(ConnectionState.Error)
          break
        }
        case 404: {
          setErrorId(ErrorId.CONFERENCE_NOT_FOUND)
          setConnectionState(ConnectionState.Error)
          break
        }
        default: {
          setConnectionState(ConnectionState.Connected)
          break
        }
      }
    } else {
      setErrorId(ErrorId.INFINITY_SERVER_UNAVAILABLE)
      setConnectionState(ConnectionState.Error)
    }
  }

  const exchangeVideos = (): void => {
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
    // Avoid to join a conference if no pexipNode is set or if it's already connected or connecting
    // This can happen if the user is not logged in to Genesys or the GenesysService is not initialized correctly
    if (
      connectingCallInProgress ||
      connectionState === ConnectionState.Connected ||
      pexipNode === ''
    ) {
      console.error(
        'Conference connection already in progress, already connected, or invalid parameters'
      )
      return
    }

    setConnectionState(ConnectionState.Connecting)
    connectingCallInProgress = true

    conferenceAlias = (await GenesysService.fetchAniName()) ?? uuidv4()

    // Test to determine if the call is dial-out or dial-in and generate a random
    // conferenceAlias in case we are dialing out. Not used currently.
    //
    // conferenceAlias = (await GenesysService.isDialOut(pexipNode))
    //   ? conferenceAlias
    //   : uuidv4()

    const prefixedConfAlias = pexipAppPrefix + conferenceAlias
    let localStream: MediaStream
    let processedStream: MediaStream
    try {
      const device = await getInitialDevice()
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: device?.deviceId } }
      })
      processedStream = await getProcessedStream(localStream, effect)
      setDevice(device)
      setLocalStream(localStream)
      setProcessedStream(processedStream)
    } catch (err) {
      setErrorId(ErrorId.CAMERA_ACCESS_DENIED)
      setConnectionState(ConnectionState.Error)
      return
    }

    const displayName = GenesysService.getAgentName()
    setDisplayName(displayName)

    await joinConference(
      pexipNode,
      prefixedConfAlias,
      processedStream,
      displayName,
      pexipAgentPin
    )

    // // Set initial context for hold and mute
    const holdState = await GenesysService.isHeld()
    const muteState = await GenesysService.isMuted()
    await onMuteCall(muteState)
    if (holdState) {
      localStream?.getTracks().forEach((track) => {
        track.stop()
      })
      await onHoldVideo(holdState)
    }
  }

  // Set the video to mute for all participants
  const onHoldVideo = async (onHold: boolean): Promise<void> => {
    const participants = infinityClient.getParticipants('main')
    // Mute current user video and set mute audio indicator even if no audio layer is used by WebRTC
    await handleCameraMuteChanged(onHold)
    // Mute other participants video
    participants.forEach((participant) => {
      infinityClient
        .muteVideo({ muteVideo: onHold, participantUuid: participant.uuid })
        .catch(console.error)
    })

    if (onHold) {
      if (presenting) {
        handlePresentationChanged().catch(console.error)
      }
    }
  }

  const onEndCall = async (shouldDisconnectAll: boolean): Promise<void> => {
    localStream?.getTracks().forEach((track) => {
      track.stop()
    })
    if (shouldDisconnectAll) {
      await infinityClient.disconnectAll({})
    }
    await infinityClient.disconnect({})
    setConnectionState(ConnectionState.Disconnected)
    connectingCallInProgress = false
  }

  const onMuteCall = async (muted: boolean): Promise<void> => {
    await infinityClient.mute({ mute: muted })
  }

  const initializeGenesys = async (
    state: GenesysState,
    accessToken: string
  ): Promise<void> => {
    // Initiate Genesys environment
    await GenesysService.initialize(
      state.pcEnvironment,
      state.pcConversationId,
      accessToken
    )

    pexipNode = state.pexipNode
    pexipAgentPin = state.pexipAgentPin
    pexipAppPrefix = state.pexipAppPrefix

    setGenesysCallbacks()

    // Stop the initialization if no call is active
    const callActive = (await GenesysService.isCallActive()) || false
    if (!callActive) {
      setConnectionState(ConnectionState.Disconnected)
    }
  }

  const handleRemoteStream = (remoteStream: MediaStream): void => {
    setRemoteStream(remoteStream)
  }

  const handleRemotePresentationStream = (
    presentationStream: MediaStream
  ): void => {
    setPresentationStream(presentationStream)
    setSecondaryVideo('remote')
  }

  /**
   * Disconnect the playback service when connected.
   */
  const checkPlaybackDisconnection = async (event: any): Promise<void> => {
    if (
      event.id === 'main' &&
      event.participant.uri.match(/^sip:.*\.playback@/) != null
    ) {
      await infinityClient.kick({ participantUuid: event.participant.uuid })
      infinitySignals.onParticipantJoined.remove(checkPlaybackDisconnection)
    }
  }

  /**
   * Check if the agent should be disconnected. This should happen after the last
   * customer participant leaves. We check if the callType is api, because the
   * agent is connected first as api and later it changes to video.
   */
  const checkIfDisconnect = async (): Promise<void> => {
    const participants = infinityClient.getParticipants('main')
    const videoParticipants = participants.filter((participant) => {
      return (
        participant.callType === CallType.video ||
        participant.callType === CallType.api
      )
    })
    if (videoParticipants.length === 1) {
      await onEndCall(true)
    }
  }

  const handleCameraMuteChanged = async (mute: boolean): Promise<void> => {
    const response = await infinityClient.muteVideo({ muteVideo: mute })
    if (response?.status === 200) {
      localStream?.getTracks().forEach((track) => {
        track.stop()
      })
      if (mute) {
        setLocalStream(undefined)
        setProcessedStream(undefined)
      } else {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device?.deviceId } }
        })
        const processedStream = await getProcessedStream(localStream, effect)
        setLocalStream(localStream)
        setProcessedStream(processedStream)
        infinityClient.setStream(processedStream)
      }
    }
  }

  const handlePresentationChanged = async (): Promise<void> => {
    setPresenting(!presenting)

    if (presenting) {
      infinityClient.stopPresenting()
      presentationStream?.getTracks().forEach((track) => {
        track.stop()
      })
      setPresentationStream(undefined)
      setSecondaryVideo('presentation')
    } else {
      try {
        const presentationStream =
          await navigator.mediaDevices.getDisplayMedia()
        setPresentationStream(presentationStream)

        presentationStream.getVideoTracks()[0].onended = () => {
          infinityClient.stopPresenting()
          presentationStream?.getTracks().forEach((track) => {
            track.stop()
          })
          setPresentationStream(undefined)
          setPresenting(false)
          setSecondaryVideo('presentation')
        }

        infinityClient.present(presentationStream)
        setSecondaryVideo('presentation')
      } catch (error) {
        console.error(error)
        setPresenting(false)
      }
    }
  }

  /**
   * Callback function that is used to detect when the presentation connection changes.
   * @param event The event that is emitted when the presentation connection changes.
   */
  const handlePresentationConnectionChange = (
    event: PresoConnectionChangeEvent
  ): void => {
    // We only care about the remote presentation stream being disconnected
    if (
      !(event.send === 'connecting' || event.send === 'connected') &&
      event.recv === 'disconnected'
    ) {
      setPresenting(false)
      setPresentationStream(undefined)
      setSecondaryVideo('presentation')
    }
  }

  const handleCopyInvitationLink = (): void => {
    const invitationLink = `https://${pexipNode}/webapp/m/${pexipAppPrefix}${conferenceAlias}/step-by-step?role=guest`
    const link = document.createElement('input')
    link.value = invitationLink
    document.body.appendChild(link)
    link.select()
    document.execCommand('copy')
    link.remove()
    notificationToastSignal.emit([
      {
        message: 'Invitation link copied to clipboard!'
      }
    ])
  }

  const handleSettingsChanged = async (settings: Settings): Promise<void> => {
    let newLocalStream = localStream
    if (settings.device?.deviceId !== device?.deviceId) {
      setDevice(settings.device)
      localStorage.setItem(
        LocalStorageKey.VideoDeviceInfo,
        JSON.stringify(settings.device)
      )
      localStream?.getTracks().forEach((track) => {
        track.stop()
      })
      newLocalStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: settings.device?.deviceId } }
      })
      setLocalStream(newLocalStream)
    }

    if (
      settings.effect !== effect ||
      settings.device?.deviceId !== device?.deviceId
    ) {
      setEffect(settings.effect)
      localStorage.setItem(LocalStorageKey.Effect, settings.effect)
      if (newLocalStream != null) {
        const processedStream = await getProcessedStream(
          newLocalStream,
          settings.effect
        )
        setProcessedStream(processedStream)
        if (processedStream != null) {
          infinityClient.setStream(processedStream)
        }
      }
    }

    if (settings.streamQuality !== streamQuality) {
      setStreamQuality(settings.streamQuality)
      localStorage.setItem(
        LocalStorageKey.StreamQuality,
        settings.streamQuality
      )
      infinityClient.setBandwidth(convertToBandwidth(settings.streamQuality))
    }
  }

  const getInitialDevice = async (): Promise<MediaDeviceInfoLike> => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true
    })
    const devices = await navigator.mediaDevices.enumerateDevices()
    localStream.getTracks().forEach((track) => {
      track.stop()
    })

    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput'
    )

    const videoDeviceInfoString =
      localStorage.getItem(LocalStorageKey.VideoDeviceInfo) ?? '{}'
    const videoDeviceInfo: MediaDeviceInfoLike = JSON.parse(
      videoDeviceInfoString
    )

    const device =
      videoDevices.find(
        (device) => device.deviceId === videoDeviceInfo.deviceId
      ) ?? videoDevices[0]

    return device
  }

  const getProcessedStream = async (
    stream: MediaStream,
    effect: Effect
  ): Promise<MediaStream> => {
    if (videoProcessor != null) {
      videoProcessor.close()
      await videoProcessor.destroy()
    }
    videoProcessor = await getVideoProcessor(effect)
    await videoProcessor.open()
    const processedStream = await videoProcessor.process(stream)
    return processedStream
  }

  const initialize = async (): Promise<void> => {
    try {
      await checkCameraAccess()
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
      pcEnvironment !== '' &&
      pcConversationId !== '' &&
      pexipNode !== '' &&
      pexipAgentPin !== '' &&
      pexipAppPrefix !== ''
    ) {
      await GenesysService.loginPureCloud(
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

      const accessToken: string = queryParams.get('access_token') ?? ''
      const state: GenesysState = JSON.parse(
        decodeURIComponent(queryParams.get('state') ?? '{}')
      )

      await initializeGenesys(state, accessToken)
      const isCallActive = await GenesysService.isCallActive()
      if (isCallActive) {
        await initConference().catch(console.error)
      } else {
        setConnectionState(ConnectionState.Disconnected)
      }
    }
  }

  useEffect(() => {
    infinitySignals = createInfinityClientSignals([], {
      batchScheduleTimeoutMS: 500,
      batchBufferSize: 10
    })
    callSignals = createCallSignals([])

    initialize().catch(console.error)

    const handleDisconnect = (): void => {
      infinityClient?.disconnect({}).catch(console.error)
    }

    window.addEventListener('beforeunload', handleDisconnect)
    return () => {
      window.removeEventListener('beforeunload', handleDisconnect)
      onEndCall(false).catch(console.error)
    }
  }, [])

  useEffect(() => {
    GenesysService.addHoldListener(onHoldVideo)
    GenesysService.addEndCallListener(onEndCall)

    callSignals.onRemoteStream.add(handleRemoteStream)
    callSignals.onRemotePresentationStream.add(handleRemotePresentationStream)
    callSignals.onPresentationConnectionChange.add(
      handlePresentationConnectionChange
    )
    infinitySignals.onParticipantJoined.add(checkPlaybackDisconnection)
    infinitySignals.onParticipantLeft.add(checkIfDisconnect)
    return () => {
      callSignals.onRemoteStream.remove(handleRemoteStream)
      callSignals.onRemotePresentationStream.remove(
        handleRemotePresentationStream
      )
      infinitySignals.onParticipantJoined.remove(checkPlaybackDisconnection)
      infinitySignals.onParticipantLeft.remove(checkIfDisconnect)
    }
  }, [presenting, presentationStream, localStream])

  const setGenesysCallbacks = (): void => {
    GenesysService.addHoldListener(onHoldVideo)
    GenesysService.addEndCallListener(onEndCall)
    GenesysService.addMuteListener(onMuteCall)
    GenesysService.addConnectCallListener(initConference)
  }

  useEffect(setGenesysCallbacks)

  return (
    <div className="App" data-testid="App" ref={appRef}>
      {errorId !== '' && connectionState === ConnectionState.Error && (
        <ErrorPanel
          error={errorId}
          onClick={() => {
            setErrorId('')
            setConnectionState(ConnectionState.Connecting)
            initialize().catch(console.error)
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

          <SelfView
            floatRoot={appRef}
            callSignals={callSignals}
            username={displayName}
            localStream={processedStream}
            onCameraMuteChanged={handleCameraMuteChanged}
          />

          <Toolbar
            infinityClient={infinityClient}
            callSignals={callSignals}
            infinitySignals={infinitySignals}
            cameraMuted={processedStream == null}
            presenting={presenting}
            onCameraMuteChanged={handleCameraMuteChanged}
            onPresentationChanged={handlePresentationChanged}
            onCopyInvitationLink={handleCopyInvitationLink}
            onSettingsChanged={handleSettingsChanged}
          />
        </>
      )}

      <NotificationToast />
    </div>
  )
}
