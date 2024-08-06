import { useEffect, useRef, useState } from 'react'
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
import {
  CenterLayout,
  NotificationToast,
  notificationToastSignal,
  Spinner,
  Video
} from '@pexip/components'
import { type StreamQuality } from '@pexip/media-components'
import { convertToBandwidth } from './media/quality'
import * as GenesysService from './genesys/genesysService'
import { ErrorPanel } from './error-panel/ErrorPanel'
import ERROR_ID from './constants/error-ids'
import { ConnectionState } from './types/ConnectionState'
import { Toolbar } from './toolbar/Toolbar'
import { Selfview } from './selfview/Selfview'
import { Settings } from './types/Settings'
import { type MediaDeviceInfoLike } from '@pexip/media-control'
import { Effect } from './types/Effect'
import { VideoProcessor } from '@pexip/media-processor'
import { getVideoProcessor } from './media/video-processor'

import './App.scss'
import { LocalStorageKey } from './types/LocalStorageKey'

let infinitySignals: InfinitySignals
let callSignals: CallSignals
let infinityClient: InfinityClient

let pexipNode: string
let pexipAgentPin: string
let pexipAppPrefix: string = 'agent'
let aniName: string
let conferenceAlias: string

let videoProcessor: VideoProcessor

export const App = (): JSX.Element => {
  const [device, setDevice] = useState<MediaDeviceInfoLike>()
  const [effect, setEffect] = useState<Effect>(
    (localStorage.getItem(LocalStorageKey.Effect) as Effect) ?? Effect.None
  )
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(
    localStorage.getItem(LocalStorageKey.StreamQuality) as StreamQuality
  )
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [processedStream, setProcessedStream] = useState<MediaStream>()
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
    let localStream: MediaStream
    let processedStream: MediaStream
    try {
      const device = await getInitialDevice()
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: device?.deviceId }
      })
      processedStream = await getProcessedStream(localStream, effect)
      setDevice(device)
      setLocalStream(localStream)
      setProcessedStream(processedStream)
    } catch (err) {
      setErrorId(ERROR_ID.CAMERA_ACCESS_DENIED)
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
    // const participantList = this.infinityClient.participants
    // Mute current user video and set mute audio indicator even if no audio layer is used by web rtc
    await handleCameraMuteChanged(onHold)
    // Mute other participants video
    // participantList.forEach((participant) => {
    //   infinityClient
    //     .muteVideo({ muteVideo: onHold, participantUuid: participant.uuid })
    //     .catch(console.error)
    // })
    // if (onHold) {
    //   await this.toolbarRef?.current?.stopScreenShare()
    // }
  }

  const onEndCall = async (shouldDisconnectAll: boolean): Promise<void> => {
    localStream?.getTracks().forEach((track) => {
      track.stop()
    })
    if (shouldDisconnectAll) {
      await infinityClient.disconnectAll({})
    }
    await infinityClient?.disconnect({})
    setConnectionState(ConnectionState.Disconnected)
  }

  const onMuteCall = async (muted: boolean): Promise<void> => {
    await infinityClient.mute({ mute: muted })
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

  const handleCameraMuteChanged = async (mute: boolean) => {
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
          video: {
            deviceId: device?.deviceId
          }
        })
        const processedStream = await getProcessedStream(localStream, effect)
        setLocalStream(localStream)
        setProcessedStream(processedStream)
        infinityClient.setStream(localStream)
      }
    }
  }

  const handleCopyInvitationLink = () => {
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

  const handleLocalPresentationStream = (
    presentationStream: MediaStream | undefined
  ) => {
    setPresentationStream(presentationStream)
    setSecondaryVideo('presentation')
  }

  const handleSettingsChanged = async (settings: Settings) => {
    let newLocalStream = localStream
    if (settings.device.deviceId !== device?.deviceId) {
      setDevice(settings.device)
      localStorage.setItem(
        LocalStorageKey.VideoDeviceInfo,
        JSON.stringify(settings.device)
      )
      localStream?.getTracks().forEach((track) => {
        track.stop()
      })
      newLocalStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: device?.deviceId }
      })
      setLocalStream(newLocalStream)
    }

    if (
      settings.effect != effect ||
      settings.device.deviceId !== device?.deviceId
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
    const devices = await navigator.mediaDevices.enumerateDevices()
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
      videoProcessor.destroy()
    }
    videoProcessor = await getVideoProcessor(effect)
    await videoProcessor.open()
    const processedStream = await videoProcessor.process(stream)
    return processedStream
  }

  useEffect(() => {
    const bootstrap = async () => {
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

        await initializeGenesys(state, accessToken)
        await initConference().catch(console.error)
      }
    }

    bootstrap().catch(console.error)

    const handleDisconnect = () => {
      infinityClient?.disconnect({})
    }

    window.addEventListener('beforeunload', handleDisconnect)
    return () => {
      // localStream?.getTracks().forEach((track) => {
      //   track.stop()
      // })
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

          <Selfview
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
            cameraMuted={localStream == null}
            onCameraMuteChanged={handleCameraMuteChanged}
            onCopyInvitationLink={handleCopyInvitationLink}
            onLocalPresentationStream={handleLocalPresentationStream}
            onSettingsChanged={handleSettingsChanged}
          />
        </>
      )}

      <NotificationToast />
    </div>
  )
}
