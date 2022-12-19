import React from 'react'
import { Tooltip } from 'react-tooltip'

import './ToolbarButton.scss'

interface ToolbarButtonProps {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  toolTip: string
  onClick: Function
  selected?: boolean
  danger?: boolean
}

export function ToolbarButton (props: ToolbarButtonProps): JSX.Element {
  const id = props.toolTip.replace(' ', '-')
  return (
    <button id={id} className={`ToolbarButton ${props.selected ?? false ? 'selected' : ''} ${props.danger ?? false ? 'danger' : ''}`} data-tip={props.toolTip} onClick={() => props.onClick()}>
      <props.icon />
      <Tooltip anchorId={id}/>
    </button>
  )
}
