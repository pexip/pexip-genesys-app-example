import React from 'react'
import ReactTooltip from 'react-tooltip'

import './ToolbarButton.scss'

interface ToolbarButtonProps {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  toolTip: string
  onClick: Function
  selected?: boolean
}

export function ToolbarButton (props: ToolbarButtonProps): JSX.Element {
  return (
    <button className={`ToolbarButton ${props.selected ?? false ? 'selected' : ''}`} data-tip={props.toolTip} onClick={() => props.onClick()}>
      <props.icon />
      <ReactTooltip effect='solid' />
    </button>
  )
}
