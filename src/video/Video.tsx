import React from 'react'

import './Video.scss'

interface VideoProps {
  mediaStream: MediaStream
  flip?: boolean
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
}

export function Video (props: VideoProps): JSX.Element {
  return (
    <video className={`Video ${props.flip ?? false ? 'flip' : ''}`} autoPlay playsInline muted
      style={ { objectFit: props.objectFit ?? 'cover' } }
      ref={ (video) => { if (video != null) video.srcObject = props.mediaStream } }
    />
  )
}
