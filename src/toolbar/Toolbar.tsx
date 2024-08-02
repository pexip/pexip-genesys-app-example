import { useEffect, useState } from 'react'
import {
  CallSignals,
  InfinitySignals,
  InfinityClient,
  PresoConnectionChangeEvent
} from '@pexip/infinity'
import { SettingsPanel } from '../settings-panel/SettingsPanel'
import copy from 'copy-to-clipboard'
import { toast } from 'react-toastify'
import { StreamQuality } from '@pexip/media-components'
import { Button, Icon, IconTypes, Tooltip } from '@pexip/components'

import './Toolbar.scss'

interface ToolbarProps {
  infinityClient: InfinityClient
  callSignals: CallSignals
  infinitySignals: InfinitySignals
  pexipNode: string
  pexipAppPrefix: string
  conferenceAlias: string
  onCameraMute: (muted: boolean) => Promise<void>
  onLocalPresentationStream: Function
  onLocalStream: Function
  onChangeStreamQuality: (streamQuality: StreamQuality) => void
}

export const Toolbar = (props: ToolbarProps): JSX.Element => {
  const [cameraMutedEnabled, setCameraMutedEnabled] = useState(false)
  const [shareScreenEnabled, setShareScreenEnabled] = useState(false)
  const [lockRoomEnabled, setLockRoomEnabled] = useState(false)
  const [popOutVideoEnabled, setPopOutVideoEnabled] = useState(false)
  const [settingsEnabled, setSettingsEnabled] = useState(false)
  const [presentationStream, setPresentationStream] = useState<MediaStream>()

  const toggleShareScreen = async (): Promise<void> => {
    if (shareScreenEnabled) {
      props.infinityClient.stopPresenting()
      presentationStream?.getTracks().forEach((track) => {
        track.stop()
      })
      props.onLocalPresentationStream(presentationStream)
    } else {
      const presentationStream = await navigator.mediaDevices.getDisplayMedia()
      setPresentationStream(presentationStream)

      presentationStream.getVideoTracks()[0].onended = () => {
        props.infinityClient.stopPresenting()
        props.onLocalPresentationStream(presentationStream)
      }

      props.infinityClient.present(presentationStream)
      props.onLocalPresentationStream(presentationStream)
    }
  }

  const toggleLockRoom = async (): Promise<void> => {
    const response = await props.infinityClient.lock({
      lock: !lockRoomEnabled
    })
    if (response?.status === 200) {
      setLockRoomEnabled(!lockRoomEnabled)
    }
  }

  const togglePopOutVideo = async (): Promise<void> => {
    const videoElement = document.getElementById(
      'remoteVideo'
    ) as HTMLVideoElement
    if (videoElement === undefined) {
      return
    }
    if (document.pictureInPictureElement != null) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      await videoElement.requestPictureInPicture()
      setPopOutVideoEnabled(true)
    }
  }

  const toggleSettings = () => {
    setSettingsEnabled(!settingsEnabled)
  }

  const copyInvitationLink = async (): Promise<void> => {
    // Example: https://pexipdemo.com/webapp/m/=mp7b6f680324ee40df8d762fdc24b54849/step-by-step?role=guest
    const invitationLink = `https://${props.pexipNode}/webapp/m/${props.pexipAppPrefix}${props.conferenceAlias}/step-by-step?role=guest`
    copy(invitationLink)
    toast('Invitation link copied to clipboard!')
  }

  useEffect(() => {
    const videoElement = document.getElementById(
      'remoteVideo'
    ) as HTMLVideoElement
    if (videoElement) {
      videoElement.addEventListener('enterpictureinpicture', () =>
        setPopOutVideoEnabled(true)
      )
      videoElement.addEventListener('leavepictureinpicture', () =>
        setPopOutVideoEnabled(false)
      )
    }
    props.callSignals.onPresentationConnectionChange.add(
      (changeEvent: PresoConnectionChangeEvent): void => {
        if (changeEvent.send === 'connected') {
          setShareScreenEnabled(true)
        } else {
          setShareScreenEnabled(false)
        }
      }
    )

    // Handle lock room context
    const status = props.infinityClient.conferenceStatus.get('main')
    setLockRoomEnabled(status?.locked ?? false)

    props.infinitySignals.onConferenceStatus.add((event): void => {
      if (event.id === 'main') {
        setLockRoomEnabled(event.status.locked)
      }
    })
  }, [])

  return (
    <>
      <div className="Toolbar" data-testid="Toolbar">
        <Tooltip text={cameraMutedEnabled ? 'Unmute camera' : 'Mute camera'}>
          <Button
            onClick={() => {
              setCameraMutedEnabled(!cameraMutedEnabled)
              props.onCameraMute(!cameraMutedEnabled)
            }}
            modifier="square"
            variant="translucent"
            isActive={cameraMutedEnabled}
          >
            <Icon
              source={
                cameraMutedEnabled
                  ? IconTypes.IconVideoOff
                  : IconTypes.IconVideoOn
              }
            />
          </Button>
        </Tooltip>

        <Tooltip
          text={shareScreenEnabled ? 'Stop sharing screen' : 'Share screen'}
        >
          <Button
            onClick={toggleShareScreen}
            modifier="square"
            variant="translucent"
            isActive={shareScreenEnabled}
          >
            <Icon
              source={
                shareScreenEnabled
                  ? IconTypes.IconPresentationOff
                  : IconTypes.IconPresentationOn
              }
            />
          </Button>
        </Tooltip>

        <Tooltip text={lockRoomEnabled ? 'Unlock room' : 'Lock room'}>
          <Button
            onClick={toggleLockRoom}
            modifier="square"
            variant="translucent"
            isActive={lockRoomEnabled}
          >
            <Icon
              source={
                lockRoomEnabled ? IconTypes.IconLock : IconTypes.IconUnlock
              }
            />
          </Button>
        </Tooltip>

        <Tooltip text={popOutVideoEnabled ? 'Return video' : 'Pop out video'}>
          <Button
            onClick={togglePopOutVideo}
            modifier="square"
            variant="translucent"
            isActive={popOutVideoEnabled}
          >
            <Icon source={IconTypes.IconOpenInNew} />
          </Button>
        </Tooltip>

        <Tooltip text="Copy invitation link">
          <Button
            onClick={copyInvitationLink}
            modifier="square"
            variant="translucent"
          >
            <Icon source={IconTypes.IconLink} />
          </Button>
        </Tooltip>

        <Tooltip text="Open settings">
          <Button
            onClick={toggleSettings}
            modifier="square"
            variant="translucent"
            isActive={settingsEnabled}
          >
            <Icon source={IconTypes.IconSettings} />
          </Button>
        </Tooltip>
      </div>
      {settingsEnabled && (
        <SettingsPanel
          onClose={() => setSettingsEnabled(false)}
          onSave={(
            localStream?: MediaStream,
            streamQuality?: StreamQuality
          ) => {
            setSettingsEnabled(false)
            if (localStream != null) {
              props.onLocalStream(localStream)
            }
            if (streamQuality != null) {
              props.onChangeStreamQuality(streamQuality)
            }
          }}
        />
      )}
    </>
  )
}
