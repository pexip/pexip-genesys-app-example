import { useEffect, useState } from 'react'
import type {
  CallSignals,
  InfinitySignals,
  InfinityClient,
  PresoConnectionChangeEvent
} from '@pexip/infinity'
import { SettingsPanel } from '../settings-panel/SettingsPanel'
import {
  Button,
  Icon,
  IconTypes,
  notificationToastSignal,
  Tooltip
} from '@pexip/components'
import { type Settings } from '../types/Settings'

import './Toolbar.scss'

interface ToolbarProps {
  infinityClient: InfinityClient
  callSignals: CallSignals
  infinitySignals: InfinitySignals
  cameraMuted: boolean
  onCameraMuteChanged: (muted: boolean) => Promise<void>
  onCopyInvitationLink: () => void
  onLocalPresentationStream: (stream: MediaStream | undefined) => void
  onSettingsChanged: (settings: Settings) => Promise<void>
}

export const Toolbar = (props: ToolbarProps): JSX.Element => {
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
      const message = lockRoomEnabled ? 'Room unlocked' : 'Room locked'
      notificationToastSignal.emit([{ message }])
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

  const toggleSettings = (): void => {
    setSettingsEnabled(!settingsEnabled)
  }

  useEffect(() => {
    const videoElement = document.getElementById(
      'remoteVideo'
    ) as HTMLVideoElement

    if (videoElement != null) {
      videoElement.addEventListener('enterpictureinpicture', () => {
        setPopOutVideoEnabled(true)
      })

      videoElement.addEventListener('leavepictureinpicture', () => {
        setPopOutVideoEnabled(false)
      })
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
        <Tooltip text={props.cameraMuted ? 'Unmute camera' : 'Mute camera'}>
          <Button
            onClick={() => {
              props.onCameraMuteChanged(!props.cameraMuted).catch(console.error)
            }}
            modifier="square"
            variant="translucent"
            isActive={props.cameraMuted}
          >
            <Icon
              source={
                props.cameraMuted
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
            onClick={() => {
              toggleShareScreen().catch(console.error)
            }}
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
            onClick={() => {
              toggleLockRoom().catch(console.error)
            }}
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
            onClick={() => {
              togglePopOutVideo().catch(console.error)
            }}
            modifier="square"
            variant="translucent"
            isActive={popOutVideoEnabled}
          >
            <Icon source={IconTypes.IconOpenInNew} />
          </Button>
        </Tooltip>

        <Tooltip text="Copy invitation link">
          <Button
            onClick={props.onCopyInvitationLink}
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
          onClose={() => {
            setSettingsEnabled(false)
          }}
          onSave={(settings: Settings) => {
            setSettingsEnabled(false)
            props.onSettingsChanged(settings).catch(console.error)
          }}
        />
      )}
    </>
  )
}
