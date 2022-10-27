import React from 'react'

import { render } from '@testing-library/react'
import { ReactComponent as icon } from './icons/share-screen.svg'

import { ToolbarButton } from './ToolbarButton'

const toolTip = 'test-tooltip'
const onClick = (): void => {}

test('renders the toolbar button', () => {
  render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
  expect(true).toBe(true)
})
