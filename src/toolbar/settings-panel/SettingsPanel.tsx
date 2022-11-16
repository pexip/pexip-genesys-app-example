import React, { useEffect, useState } from 'react'

import { AudioOutputTestButton, DevicesList, MediaControlSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Modal, ProgressBar } from '@pexip/components'

import './SettingsPanel.scss'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel (props: SettingsPanelProps): JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [audioInput, setAudioInput] = useState<MediaDeviceInfoLike>()
  const [audioOutput, setAudioOutput] = useState<MediaDeviceInfoLike>()
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>()
  const [audioLevel, setAudioLevel] = useState<number>(0)

  let audioLevelInterval: NodeJS.Timer

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
      setAudioInput(device)
    } }
    onAudioOutputChange={(device: MediaDeviceInfoLike): void => {
      setAudioOutput(device)
    } }
    onVideoInputChange={(device: MediaDeviceInfoLike): void => {
      setVideoInput(device)
    }}
    audioInput={audioInput}
    audioOutput={audioOutput}
    videoInput={videoInput}
  />

  const configurePreview = async (): Promise<void> => {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true }
    })
    const audioContext = new AudioContext()
    const audioSource = audioContext.createMediaStreamSource(audioStream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.minDecibels = -127
    analyser.maxDecibels = 0
    analyser.smoothingTimeConstant = 0.4
    audioSource.connect(analyser)
    const volumes = new Uint8Array(analyser.frequencyBinCount)
    const volumeCallback = (): void => {
      analyser.getByteFrequencyData(volumes)
      let volumeSum = 0
      for (const volume of volumes) {
        volumeSum += volume
      }
      const averageVolume = volumeSum / volumes.length
      // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
      const percentage = Math.round((averageVolume * 100 / 127))
      console.log(percentage)
      setAudioLevel(percentage)
    }
    audioLevelInterval = setInterval(volumeCallback, 100)
  }

  useEffect(() => {
    const asyncBootstrap = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setDevices(devices)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setLocalMediaStream(mediaStream)
      await configurePreview()
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      clearInterval(audioLevelInterval)
    }
  }, [])

  const inputAudioTester = <ProgressBar progress={audioLevel} />
  const outputAudioTester = <AudioOutputTestButton onClick={function (): void {
    throw new Error('Function not implemented.')
  } } shouldPlay={false} />

  return (
    <Modal isOpen={true} className='SettingsPanel'>
      <MediaControlSettings
        inputAudioTester={inputAudioTester}
        outputAudioTester={outputAudioTester}
        handleCancel={props.onClose}
        handleNoiseSuppression={() => {}}
        handleSave={() => {}}
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
