{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

import React from 'react'

import './Video.scss'

interface VideoProps {
  mediaStream: MediaStream
  flip?: boolean
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  secondary?: boolean
  onClick?: Function
  id?: string
}

export const Video = React.memo((props: VideoProps): JSX.Element => {
  const className = 'Video' +
    (props.flip ?? false ? ' flip' : '') +
    (props.secondary ?? false ? ' secondary' : '')
  return (
    <video className={className} id={props.id} autoPlay playsInline muted
      style={ { objectFit: props.objectFit ?? 'contain' } }
      ref={ (video) => { if (video != null) video.srcObject = props.mediaStream }}
      onClick={() => { if (props.onClick != null) props.onClick() }}
    />
  )
})

Video.displayName = 'Video'
