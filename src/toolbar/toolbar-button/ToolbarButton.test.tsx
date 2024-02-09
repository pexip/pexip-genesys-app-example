{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ReactComponent as icon } from '../icons/share-screen.svg'
import { ToolbarButton } from './ToolbarButton'

const toolTip = 'test-tooltip'
const onClick = jest.fn()

describe('ToolbarButton component', () => {
  it('renders the toolbar button', () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('doesn\'t render the tooltip by default', () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    const toolTipEl = screen.queryByText('test-tooltip')
    expect(toolTipEl).toBeNull()
  })

  it('renders the tooltip when hover', async () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    await fireEvent.mouseEnter(screen.getByRole('button'))
    const toolTipEl = screen.getByText('test-tooltip')
    expect(toolTipEl).toBeInTheDocument()
    expect(toolTipEl).toBeVisible()
  })

  it('doesn\'t render the tooltip when move mouse away', async () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    await fireEvent.mouseEnter(screen.getByRole('button'))
    await fireEvent.mouseLeave(screen.getByRole('button'))
    const toolTipEl = screen.getByText('test-tooltip')
    expect(toolTipEl).toBeInTheDocument()
    expect(toolTipEl).not.toBeVisible()
  })

  it('doesn\'t call the onClick function until clicked', async () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    expect(onClick).toHaveBeenCalledTimes(0)
  })

  it('call the onClick function when clicked', async () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should\'t have the class "enabled" if not property "selected"', () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} />)
    expect(screen.getByRole('button')).not.toHaveClass('selected')
  })

  it('should\'t have the class "enabled" if property "selected=false"', () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} selected={false} />)
    expect(screen.getByRole('button')).not.toHaveClass('selected')
  })

  it('should add the class "enabled" if property "selected=true"', () => {
    render(<ToolbarButton icon={icon} toolTip={toolTip} onClick={onClick} selected={true} />)
    expect(screen.getByRole('button')).toHaveClass('selected')
  })
})
