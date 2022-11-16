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
      audio: true
    })
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(audioStream)
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1)

    analyser.smoothingTimeConstant = 0.8
    analyser.fftSize = 1024

    microphone.connect(analyser)
    analyser.connect(scriptProcessor)
    scriptProcessor.connect(audioContext.destination)
    scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(array)
      const arraySum = array.reduce((a, value) => a + value, 0)
      const average = arraySum / array.length
      console.log(Math.round(average))
      setAudioLevel(Math.round(average))
    }
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
