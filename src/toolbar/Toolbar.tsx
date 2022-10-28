import React from 'react'

import { ToolbarButton } from './ToolbarButton'

import { ReactComponent as shareScreenIcon } from './icons/share-screen.svg'
import { ReactComponent as lockIcon } from './icons/lock.svg'
import { ReactComponent as settingsIcon } from './icons/settings.svg'
import { ReactComponent as popUpVideoIcon } from './icons/pop-up-video.svg'

import './Toolbar.scss'

interface ToolbarState {
  shareScreenEnabled: boolean
  lockRoomEnabled: boolean
  popOutVideoEnabled: boolean
  settingsEnabled: boolean
}

export class Toolbar extends React.Component<{}, ToolbarState> {
  constructor (props: {}) {
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

  render (): JSX.Element {
    return (
      <div className="Toolbar">
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

  private toggleShareScreen (): void {

  }

  private toggleLockRoom (): void {

  }

  private togglePopOutVideo (): void {

  }

  private toggleSettings (): void {

  }
}
