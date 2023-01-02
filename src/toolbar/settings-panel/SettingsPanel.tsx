import React, { useEffect, useState } from 'react'

import { DevicesList, SelfViewSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Bar, Button, Modal, TextHeading, FontVariant, Select, IconTypes } from '@pexip/components'
import { RenderEffects } from '@pexip/media-processor'

import { getLocalStream, stopStream } from '../../media/media'

import './SettingsPanel.scss'
import { Effect } from './effect/Effect'

import { Trans, useTranslation } from 'react-i18next'
import { getProcessedStream } from '../../media/processor'

interface SettingsPanelProps {
  onClose: () => void
  onSave: (localMediaStream: MediaStream) => void
}

interface HeaderProps {
  text: string
  i18key: string
}

export function SettingsPanel (props: SettingsPanelProps): JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>()
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(StreamQuality.Auto)
  const [effect, setEffect] = useState<RenderEffects>('none')

  const bgImageUrl = './media-processor/background.jpg'

  const deviceList = <DevicesList
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
        className="mb-5 mt-4"
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
    console.log('Changes in Settings panel')
    let mediaStream: MediaStream
    const asyncBootstrap = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setDevices(devices.filter((device) => device.kind === 'videoinput'))
      let mediaStream = await getLocalStream(videoInput?.deviceId)
      if (effect !== 'none') {
        console.log('PROCESSING')
        mediaStream = await getProcessedStream(mediaStream, effect)
      } else {
        console.log('NONE')
      }
      setLocalMediaStream(mediaStream)
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      if (mediaStream != null) stopStream(mediaStream)
    }
  }, [videoInput, effect])

  const handleSave = (): void => {
    if (videoInput != null) {
      getLocalStream(videoInput.deviceId, true).then((mediaStream) => {
        props.onSave(mediaStream)
      }).catch((error) => console.error(error))
    }
    props.onClose()
  }

  const { t } = useTranslation()

  return (
    <Modal isOpen={true} className='SettingsPanel'>

      <SelfViewSettings mediaStream={localMediaStream} />

      <Header text='Devices' i18key='settings.devices' />
      { deviceList }

      <Header text='Effects' i18key='settings.effects' />
      <Bar className='effect-list'>
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
            onClick={handleSave}
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
