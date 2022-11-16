import React from 'react'

import { DevicesList, MediaControlSettings, StreamQuality } from '@pexip/media-components'
import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Modal, ProgressBar } from '@pexip/components'

import './SettingsPanel.scss'

export function SettingsPanel (): JSX.Element {
  const deviceList = <DevicesList devices={[]} videoInputError={{
    title: '',
    description: undefined,
    deniedDevice: undefined
  }} audioInputError={{
    title: '',
    description: undefined,
    deniedDevice: undefined
  }} onAudioInputChange={function (device: MediaDeviceInfoLike): void {
    throw new Error('Function not implemented.')
  } } onAudioOutputChange={function (device: MediaDeviceInfoLike): void {
    throw new Error('Function not implemented.')
  } } onVideoInputChange={function (device: MediaDeviceInfoLike): void {
    throw new Error('Function not implemented.')
  } }></DevicesList>

  return (
    <Modal isOpen={true} className='SettingsPanel'>
      <MediaControlSettings
        inputAudioTester=<ProgressBar progress={50} />
        outputAudioTester= <span></span>
        handleCancel={() => {}}
        handleNoiseSuppression={() => {}}
        handleSave={() => {}}
        allowToSave={true}
        isSaving={false}
        noiseSuppression={false}
        previewStreamQuality={StreamQuality.Auto}
        setPreviewStreamQuality={() => {}}
        deviceList={deviceList}
      />
    </Modal>
  )
}
