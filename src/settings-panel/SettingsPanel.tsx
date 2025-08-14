import { useEffect, useState } from 'react'
import {
  DeviceSelect,
  SelfViewSettings,
  StreamQuality
} from '@pexip/media-components'
import {
  createIndexedDevices,
  type MediaDeviceInfoLike
} from '@pexip/media-control'
import {
  Bar,
  Button,
  Modal,
  TextHeading,
  Select,
  IconTypes
} from '@pexip/components'
import { type VideoProcessor } from '@pexip/media-processor'
import { EffectButton } from './effect-button/EffectButton'
import { Effect } from '../types/Effect'
import { getVideoProcessor } from '../media/video-processor'
import { LocalStorageKey } from '../types/LocalStorageKey'
import { type Settings } from '../types/Settings'

import './SettingsPanel.scss'

const bgImageUrl = './media-processor/background.jpg'

let videoProcessor: VideoProcessor

interface SettingsPanelProps {
  onClose: () => void
  onSave: (settings: Settings) => void
}

export const SettingsPanel = (props: SettingsPanelProps): JSX.Element => {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [device, setDevice] = useState<MediaDeviceInfoLike>()
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [processedStream, setProcessedStream] = useState<MediaStream>()
  const [effect, setEffect] = useState<Effect>(Effect.None)
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(
    StreamQuality.Auto
  )

  const handleChangeDevice = async (deviceId: string): Promise<void> => {
    const device = devices.find((device) => device.deviceId === deviceId)
    setDevice(device)
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    })
    setLocalStream(localStream)
    handleChangeEffect(effect, localStream).catch(console.error)
  }

  const handleChangeEffect = async (
    effect: Effect,
    stream: MediaStream | undefined = localStream
  ): Promise<void> => {
    setEffect(effect)
    if (stream == null) {
      return
    }
    if (videoProcessor != null) {
      videoProcessor.close()
      await videoProcessor.destroy()
    }
    videoProcessor = await getVideoProcessor(effect)
    await videoProcessor.open()
    const processedStream = await videoProcessor.process(stream)
    setProcessedStream(processedStream)
  }

  const handleChangeStreamQuality = (id: string): void => {
    setStreamQuality(id as StreamQuality)
  }

  useEffect(() => {
    const asyncBootstrap = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      )
      setDevices(videoDevices)

      const videoDeviceInfoString =
        localStorage.getItem(LocalStorageKey.VideoDeviceInfo) ?? '{}'
      const videoDeviceInfo: MediaDeviceInfoLike = JSON.parse(
        videoDeviceInfoString
      )

      const device =
        videoDevices.find(
          (device) => device.deviceId === videoDeviceInfo.deviceId
        ) ?? videoDevices[0]

      if (device != null) {
        setDevice(device)
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } }
        })
        handleChangeEffect(effect, localStream).catch(console.error)
        setLocalStream(localStream)
      }
    }

    const effect =
      (localStorage.getItem(LocalStorageKey.Effect) as Effect) ?? Effect.None
    const streamQuality =
      (localStorage.getItem(LocalStorageKey.StreamQuality) as StreamQuality) ??
      StreamQuality.Auto
    setEffect(effect)
    setStreamQuality(streamQuality)

    asyncBootstrap().catch(console.error)
  }, [])

  const handleSave = async (): Promise<void> => {
    if (device != null) {
      props.onSave({
        device,
        effect,
        streamQuality
      })
    }
  }

  return (
    <Modal
      isOpen={true}
      withCloseButton={true}
      className="SettingsPanel"
      data-testid="SettingsPanel"
    >
      <SelfViewSettings srcObject={processedStream} data-testid="selfview" />

      <TextHeading htmlTag={'h5'}>Devices</TextHeading>

      <DeviceSelect
        data-testid="device-select"
        devices={createIndexedDevices(devices)}
        isDisabled={false}
        label={''}
        onDeviceChange={(id) => {
          const [deviceId] = id.split(':')
          handleChangeDevice(deviceId).catch(console.error)
        }}
        iconType={IconTypes.IconVideoOn}
        kind={'videoinput'}
        selected={device}
      />

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

      <Select
        className="QualityList mb-5 mt-4"
        iconType={IconTypes.IconBandwidth}
        isFullWidth
        label="Select meeting quality"
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
        onValueChange={handleChangeStreamQuality}
        sizeModifier="small"
        value={streamQuality}
      />

      <Bar>
        <Button
          onClick={() => {
            localStream?.getTracks().forEach((track) => {
              track.stop()
            })
            props.onClose()
          }}
          variant="tertiary"
          size="medium"
          modifier="fullWidth"
        >
          Cancel
        </Button>

        <Button
          onClick={() => {
            localStream?.getTracks().forEach((track) => {
              track.stop()
            })
            handleSave().catch(console.error)
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
