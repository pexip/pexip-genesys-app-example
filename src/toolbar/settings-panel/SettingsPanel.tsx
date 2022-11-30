import React, { useEffect, useState } from 'react'

import { DevicesList, MediaControlSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Modal } from '@pexip/components'

import './SettingsPanel.scss'

interface SettingsPanelProps {
  onClose: () => void
  onSave: (localMediaStream: MediaStream) => void
}

export function SettingsPanel (props: SettingsPanelProps): JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>()

  const deviceList = <DevicesList devices={devices}
    audioInputError={{
      title: '',
      description: undefined,
      deniedDevice: undefined
    }}
    videoInputError={{
      title: '',
      description: undefined,
      deniedDevice: undefined
    }}
    onAudioInputChange={(device: MediaDeviceInfoLike): void => {
      throw new Error('Function not implemented.')
    }}
    onAudioOutputChange={(device: MediaDeviceInfoLike): void => {
      throw new Error('Function not implemented.')
    }}
    onVideoInputChange={(device: MediaDeviceInfoLike): void => {
      setVideoInput(device)
    } }
    videoInput={videoInput}
    setShowHelpVideo={() => {}}
  />

  useEffect(() => {
    let mediaStream: MediaStream
    const asyncBootstrap = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setDevices(devices.filter((device) => device.kind === 'videoinput'))
      if (videoInput == null) {
        const videoInputId = localStorage.getItem('pexipVideoInputId')
        let device = devices.find((device) => device.deviceId === videoInputId)
        if (device == null) {
          device = devices[0]
        }
        setVideoInput(device)
      }
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoInput?.deviceId } })
      setLocalMediaStream(mediaStream)
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop())
    }
  }, [videoInput])

  const inputAudioTester = <span />
  const outputAudioTester = <span />

  const handleSave = (): void => {
    if (videoInput != null) {
      localStorage.setItem('pexipVideoInputId', videoInput?.deviceId)
      navigator.mediaDevices.getUserMedia({ video: { deviceId: videoInput?.deviceId } }).then((mediaStream) => {
        props.onSave(mediaStream)
      }).catch((error) => console.error(error))
    }
    props.onClose()
  }

  return (
    <Modal isOpen={true} className='SettingsPanel'>
      <MediaControlSettings
        inputAudioTester={inputAudioTester}
        outputAudioTester={outputAudioTester}
        handleCancel={props.onClose}
        handleNoiseSuppression={() => {}}
        handleSave={handleSave}
        allowToSave={true}
        isSaving={false}
        noiseSuppression={false}
        previewStreamQuality={StreamQuality.Auto}
        setPreviewStreamQuality={() => {}}
        deviceList={deviceList}
        previewStream={localMediaStream}
      />
    </Modal>
  )
}
