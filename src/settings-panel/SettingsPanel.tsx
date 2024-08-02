import { useEffect, useState } from 'react'
import {
  DeviceSelect,
  SelfViewSettings,
  StreamQuality
} from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import {
  Bar,
  Button,
  Modal,
  TextHeading,
  Select,
  IconTypes
} from '@pexip/components'
import { VideoProcessor } from '@pexip/media-processor'
import { getCurrentDeviceId, getLocalStream, stopStream } from '../media/media'
import { EffectButton } from './effect-button/EffectButton'
import { getStreamQuality } from '../media/quality'
import { Effect } from '../types/Effect'

import './SettingsPanel.scss'
import { getVideoProcessor } from '../media/video-processor'

let videoProcessor: VideoProcessor

interface SettingsPanelProps {
  onClose: () => void
  onSave: (
    localMediaStream?: MediaStream,
    streamQuality?: StreamQuality
  ) => void
}

export const SettingsPanel = (props: SettingsPanelProps): JSX.Element => {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [processedStream, setProcessedStream] = useState<MediaStream>()
  const [effect, setEffect] = useState<Effect>(Effect.None)
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(
    getStreamQuality()
  )

  const bgImageUrl = './media-processor/background.jpg'

  const deviceSelect = (
    <DeviceSelect
      devices={devices}
      isDisabled={false}
      label={''}
      onDeviceChange={(device) => {
        setVideoInput(device)
      }}
      mediaDeviceInfoLike={videoInput}
      iconType={IconTypes.IconVideoOn}
    />
  )

  const QualityList = (): JSX.Element => {
    return (
      <Select
        className="QualityList mb-5 mt-4"
        iconType={IconTypes.IconBandwidth}
        isFullWidth
        label="Select meeting quality"
        // label={t('quality.select-quality', 'Select meeting quality')}
        labelModifier="hidden"
        options={[
          {
            id: StreamQuality.Low,
            label: 'Low'
          },
          {
            id: StreamQuality.Medium,
            label: 'Medium'
          },
          {
            id: StreamQuality.High,
            label: 'High'
          },
          {
            id: StreamQuality.VeryHigh,
            label: 'Very High'
          },
          {
            id: StreamQuality.Auto,
            label: 'Auto'
          }
        ]}
        onValueChange={(id: string) => {
          setStreamQuality(id as StreamQuality)
        }}
        sizeModifier="small"
        value={streamQuality}
      />
    )
  }

  const handleChangeEffect = async (effect: Effect): Promise<void> => {
    setEffect(effect)
    if (localStream == null) {
      console.error('Local stream is null')
      return
    }
    if (videoProcessor != null) {
      videoProcessor.close()
      videoProcessor.destroy()
    }
    videoProcessor = await getVideoProcessor(effect)
    await videoProcessor.open()
    const processedStream = await videoProcessor.process(localStream)
    setProcessedStream(processedStream)
  }

  useEffect(() => {
    let mediaStream: MediaStream
    const asyncBootstrap = async (): Promise<void> => {
      if (localStream != null) {
        stopStream(localStream)
      }
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      )
      const currentDeviceId = getCurrentDeviceId()
      const currentDevice =
        videoDevices.find((device) => device.deviceId === currentDeviceId) ??
        videoDevices[0]
      if (videoInput == null) {
        setVideoInput(currentDevice)
      }
      if (devices.length > 0) {
        mediaStream = await getLocalStream(videoInput?.deviceId)
        setLocalStream(mediaStream)
      }
      setDevices(videoDevices)
      handleChangeEffect(effect).catch(console.error)
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      if (mediaStream != null) {
        stopStream(mediaStream)
      }
    }
  }, [videoInput])

  const handleSave = async (): Promise<void> => {
    let newMediaStream
    let newStreamQuality
    let deviceId = videoInput?.deviceId
    if (deviceId == null) deviceId = devices[0].deviceId
    newMediaStream = await getLocalStream(deviceId, true)
    if (streamQuality !== getStreamQuality()) {
      newStreamQuality = streamQuality
    }
    props.onSave(newMediaStream, newStreamQuality)
  }

  return (
    <Modal
      isOpen={true}
      withCloseButton={true}
      className="SettingsPanel"
      data-testid="SettingsPanel"
    >
      <SelfViewSettings mediaStream={processedStream} data-testid="selfview" />

      <TextHeading htmlTag={'h5'}>Devices</TextHeading>

      {deviceSelect}

      <TextHeading htmlTag={'h5'}>Effects</TextHeading>
      <Bar className="effect-list">
        <EffectButton
          name="None"
          onClick={() => {
            handleChangeEffect(Effect.None).catch(console.error)
          }}
          active={effect === Effect.None}
          iconSource={IconTypes.IconBlock}
        />
        <EffectButton
          name="Blur"
          onClick={() => {
            handleChangeEffect(Effect.Blur).catch(console.error)
          }}
          active={effect === Effect.Blur}
          iconSource={IconTypes.IconBackgroundBlur}
        />
        <EffectButton
          name="Background"
          onClick={() => {
            handleChangeEffect(Effect.Overlay).catch(console.error)
          }}
          active={effect === Effect.Overlay}
          bgImageUrl={bgImageUrl}
        />
      </Bar>
      <TextHeading htmlTag="h5">Connection quality</TextHeading>
      <QualityList />

      <Bar>
        <Button
          onClick={props.onClose}
          variant="tertiary"
          size="medium"
          modifier="fullWidth"
        >
          Cancel
        </Button>

        <Button
          onClick={() => {
            handleSave().catch((err) => console.error(err))
          }}
          type="submit"
          modifier="fullWidth"
          className="ml-2"
        >
          Save
        </Button>
      </Bar>
    </Modal>
  )
}
