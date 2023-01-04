import React, { useEffect, useState } from 'react'

import { DevicesList, SelfViewSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Bar, Button, Modal, TextHeading, FontVariant, Select, IconTypes } from '@pexip/components'
import { RenderEffects } from '@pexip/media-processor'

import { getLocalStream, stopStream } from '../../media/media'

import './SettingsPanel.scss'
import { Effect } from './effect/Effect'

import { Trans, useTranslation } from 'react-i18next'
import { getCurrentEffect, getProcessedStream } from '../../media/processor'
import { retrieveStreamQuality } from '../../media/quality'

interface SettingsPanelProps {
  onClose: () => void
  onSave: (localMediaStream: MediaStream, streamQuality?: StreamQuality) => void
}

interface HeaderProps {
  text: string
  i18key: string
}

export function SettingsPanel (props: SettingsPanelProps): JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLike[]>([])
  const [videoInput, setVideoInput] = useState<MediaDeviceInfoLike>()
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>()
  const [streamQuality, setStreamQuality] = useState<StreamQuality>(retrieveStreamQuality())
  const [effect, setEffect] = useState<RenderEffects>(getCurrentEffect())

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
    const asyncBootstrap = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setDevices(devices.filter((device) => device.kind === 'videoinput'))
      let mediaStream = await getLocalStream(videoInput?.deviceId)
      mediaStream = await getProcessedStream(mediaStream, effect)
      setLocalMediaStream(mediaStream)
    }
    asyncBootstrap().catch((error) => console.error(error))
    return () => {
      if (localMediaStream != null) stopStream(localMediaStream)
    }
  }, [videoInput, effect])

  const handleSave = async (): Promise<void> => {
    if (videoInput != null) {
      let mediaStream = await getLocalStream(videoInput.deviceId, true)
      mediaStream = await getProcessedStream(mediaStream, effect, true)
      if (streamQuality !== retrieveStreamQuality()) {
        props.onSave(mediaStream, streamQuality)
      } else {
        props.onSave(mediaStream)
      }
    }
    props.onClose()
  }

  const { t } = useTranslation()

  return (
    <Modal isOpen={true} withCloseButton={true} className='SettingsPanel' data-testid='SettingsPanel'>

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
