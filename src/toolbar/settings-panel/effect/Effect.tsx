import React from 'react'

import {
  Box,
  Icon,
  IconSource,
  InteractiveElement,
  Text
} from '@pexip/components'

import './Effect.scss'

interface EffectProps {
  name: string
  onClick: () => void
  active: boolean
  iconSource?: IconSource
  bgImageUrl?: string
}

export function Effect (props: EffectProps): JSX.Element {
  return (
    <div className='Effect' data-testid='Effect'>
      <InteractiveElement className='button' onClick={() => props.onClick()}>
        <Box padding='compact' className={'box' + (props.active ? ' active ' : '')} >
          { props.iconSource != null && <Icon source={props.iconSource} colorScheme='light' /> }
          { props.bgImageUrl != null && <div style={{ backgroundImage: `url(${props.bgImageUrl})` }} className='background' /> }
        </Box>
        <Text htmlTag="span">{props.name}</Text>
      </InteractiveElement>
    </div>
  )
}
