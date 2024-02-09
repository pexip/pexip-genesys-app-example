{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

import React, { useEffect, useState } from 'react'

import { DevicesList, SelfViewSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Bar, Button, Modal, TextHeading, FontVariant, Select, IconTypes } from '@pexip/components'
import { RenderEffects } from '@pexip/media-processor'

import { getCurrentDeviceId, getLocalStream, stopStream } from '../media/media'

import { Effect } from './effect/Effect'

import { Trans, useTranslation } from 'react-i18next'
import { getCurrentEffect, getProcessedStream, stopProcessedStream } from '../media/processor'
import { getStreamQuality } from '../media/quality'

import './SettingsPanel.scss'

interface SettingsPanelProps {
  onClose: () => void
  onSave: (localMediaStream?: MediaStream, streamQuality?: StreamQuality) => void
}

interface HeaderProps {
  text: string
  i18key: string
}

export function SettingsPanel (props: SettingsPanelProps): JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>()
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(getStreamQuality())
  const [effect, setEffect] = useState<RenderEffects>(getCurrentEffect())

  const bgImageUrl = './media-processor/background.jpg'

  const deviceList = <DevicesList
    data-testid='devices-list'
    devices={devices}
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

  const Header = (props: HeaderProps): JSX.Element => {
    return (
      <TextHeading
        htmlTag="h3"
        fontVariant={FontVariant.H5}
        className="mb-1 mt-4"
      >
        <Trans t={t} i18nKey={props.i18key}>
            {props.text}
        </Trans>
      </TextHeading>
    )
  }

  const QualityList = (): JSX.Element => {
    return (
      <Select
        className="QualityList mb-5 mt-4"
        iconType={IconTypes.IconBandwidth}
        isFullWidth
        label={t('quality.select-quality', 'Select meeting quality')}
        labelModifier="hidden"
        options={[
          {
            id: StreamQuality.Low,
            label: t('quality.low', 'Low')
          },
          {
            id: StreamQuality.Medium,
            label: t('quality.medium', 'Medium')
          },
          {
            id: StreamQuality.High,
            label: t('quality.high', 'High')
          },
          {
            id: StreamQuality.VeryHigh,
            label: t('quality.very-high', 'Very High')
          },
          {
            id: StreamQuality.Auto,
            label: t('quality.auto', 'Auto')
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

  useEffect(() => {
    let mediaStream: MediaStream
    const asyncBootstrap = async (): Promise<void> => {
      if (localMediaStream != null) {
        stopProcessedStream(localMediaStream.id)
        stopStream(localMediaStream)
      }
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')
      const currentDeviceId = getCurrentDeviceId()
      const currentDevice = videoDevices.find(
        (device) => device.deviceId === currentDeviceId
      ) ?? videoDevices[0]
      if (videoInput == null) {
        setVideoInput(currentDevice)
      }
      // Only get the localStream if we have already obtained the devices
      // If we don't do this, we will obtain the localStream twice
      if (devices.length > 0) {
        mediaStream = await getLocalStream(videoInput?.deviceId)
        const preview = true
        mediaStream = await getProcessedStream(mediaStream, effect, preview)
        setLocalMediaStream(mediaStream)
      }
      setDevices(videoDevices)
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      if (mediaStream != null) {
        stopProcessedStream(mediaStream.id)
        stopStream(mediaStream)
      }
    }
  }, [videoInput, effect])

  const handleSave = async (): Promise<void> => {
    let newMediaStream
    let newStreamQuality
    if (videoInput != null || (effect !== getCurrentEffect())) {
      let deviceId = videoInput?.deviceId
      if (deviceId == null) deviceId = devices[0].deviceId
      newMediaStream = await getLocalStream(deviceId, true)
      const preview = false
      const save = true
      newMediaStream = await getProcessedStream(newMediaStream, effect, preview, save)
    }
    if (streamQuality !== getStreamQuality()) {
      newStreamQuality = streamQuality
    }
    props.onSave(newMediaStream, newStreamQuality)
  }

  const { t } = useTranslation()

  return (
    <Modal isOpen={true} withCloseButton={true} className='SettingsPanel' data-testid='SettingsPanel'>

      <SelfViewSettings mediaStream={localMediaStream} data-testid='selfview'/>

      <Header text='Devices' i18key='settings.devices' />
      { deviceList }

      {/* <Header text='Effects' i18key='settings.effects' /> */}
      <Bar className='effect-list' style={{ display: 'none' }}>
        <Effect
          name={t('media.effect.none', 'None')}
          onClick={() => setEffect('none')}
          active={effect === 'none'}
          iconSource={IconTypes.IconBlock}
        />
        <Effect
          name={t('media.effect.blur', 'Blur')}
          onClick={() => setEffect('blur')}
          active={effect === 'blur'}
          iconSource={IconTypes.IconBackgroundBlur}
        />
        <Effect
          name={t('media.effect.replace', 'Replace')}
          onClick={() => setEffect('overlay')}
          active={effect === 'overlay'}
          bgImageUrl={bgImageUrl}
        />
      </Bar>
      <Header text='Connection quality' i18key='quality.quality' />
      <QualityList />

      <Bar>
          <Button
            onClick={props.onClose}
            variant="tertiary"
            size="medium"
            modifier="fullWidth"
          >
            <Trans t={t} i18nKey="settings.cancel-changes">
                Cancel changes
            </Trans>
          </Button>

          <Button
            onClick={() => { handleSave().catch((err) => console.error(err)) }}
            type="submit"
            modifier="fullWidth"
            className="ml-2"
          >
            <Trans t={t} i18nKey="settings.save-changes">
              Save changes
            </Trans>
          </Button>
        </Bar>

    </Modal>
  )
}
