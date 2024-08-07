import {
  Box,
  Icon,
  type IconSource,
  InteractiveElement,
  Text,
  FontVariant
} from '@pexip/components'

import './EffectButton.scss'

interface EffectButtonProps {
  name: string
  onClick: () => void
  active: boolean
  iconSource?: IconSource
  bgImageUrl?: string
}

export function EffectButton(props: EffectButtonProps): JSX.Element {
  return (
    <div className="Effect" data-testid="Effect">
      <InteractiveElement
        className="button"
        onClick={() => {
          props.onClick()
        }}
      >
        <Box
          padding="compact"
          className={'box' + (props.active ? ' active ' : '')}
        >
          {props.iconSource != null && (
            <Icon
              source={props.iconSource}
              colorScheme="light"
              className="icon"
            />
          )}
          {props.bgImageUrl != null && (
            <div
              style={{ backgroundImage: `url(${props.bgImageUrl})` }}
              className="background"
            />
          )}
        </Box>
        <Text
          htmlTag="span"
          className="label"
          fontVariant={props.active ? FontVariant.BodyBold : FontVariant.Body}
        >
          {props.name}
        </Text>
      </InteractiveElement>
    </div>
  )
}
