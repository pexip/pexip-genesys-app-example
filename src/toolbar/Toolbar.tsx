import React from 'react'

import { InfinityClient } from '@pexip/infinity'

import { ToolbarButton } from './ToolbarButton'

import { ReactComponent as shareScreenIcon } from './icons/share-screen.svg'
import { ReactComponent as lockIcon } from './icons/lock.svg'
import { ReactComponent as settingsIcon } from './icons/settings.svg'
import { ReactComponent as popUpVideoIcon } from './icons/pop-up-video.svg'

import './Toolbar.scss'

interface ToolbarProps {
  infinityClient: InfinityClient
}

interface ToolbarState {
  shareScreenEnabled: boolean
  lockRoomEnabled: boolean
  popOutVideoEnabled: boolean
  settingsEnabled: boolean
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
  constructor (props: ToolbarProps) {
    super(props)
    this.state = {
      shareScreenEnabled: false,
      lockRoomEnabled: false,
      popOutVideoEnabled: false,
      settingsEnabled: false
    }
    this.toggleShareScreen = this.toggleShareScreen.bind(this)
    this.toggleLockRoom = this.toggleLockRoom.bind(this)
    this.togglePopOutVideo = this.togglePopOutVideo.bind(this)
    this.toggleSettings = this.toggleSettings.bind(this)
  }

  private toggleShareScreen (): void {

  }

  private toggleLockRoom (): void {

  }

  private togglePopOutVideo (): void {

  }

  private toggleSettings (): void {

  }

  render (): JSX.Element {
    return (
      <div className="Toolbar" data-testid='Toolbar'>
        <ToolbarButton icon={shareScreenIcon} toolTip='Share screen'
          selected={this.state.shareScreenEnabled}
          onClick={this.toggleShareScreen}
        />
        <ToolbarButton icon={lockIcon} toolTip='Lock Room'
          selected={this.state.shareScreenEnabled}
          onClick={this.toggleShareScreen}
        />
        <ToolbarButton icon={popUpVideoIcon} toolTip='Pop Up Video'
          selected={this.state.shareScreenEnabled}
          onClick={this.toggleShareScreen}
        />
        <ToolbarButton icon={settingsIcon} toolTip='Open Settings'
          selected={this.state.shareScreenEnabled}
          onClick={this.toggleShareScreen}
        />
      </div>
    )
  }
}
