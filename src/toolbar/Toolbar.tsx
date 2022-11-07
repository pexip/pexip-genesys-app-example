import React from 'react'

import { CallSignals, InfinityClient, PresoConnectionChangeEvent } from '@pexip/infinity'

import { ToolbarButton } from './ToolbarButton'

import { ReactComponent as shareScreenIcon } from './icons/share-screen.svg'
import { ReactComponent as lockIcon } from './icons/lock.svg'
import { ReactComponent as settingsIcon } from './icons/settings.svg'
import { ReactComponent as popUpVideoIcon } from './icons/pop-up-video.svg'

import './Toolbar.scss'

interface ToolbarProps {
  infinityClient: InfinityClient
  callSignals: CallSignals
  onLocalPresentationStream: Function
}

interface ToolbarState {
  shareScreenEnabled: boolean
  lockRoomEnabled: boolean
  popOutVideoEnabled: boolean
  settingsEnabled: boolean
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
  private presentationStream!: MediaStream
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

  private async toggleShareScreen (): Promise<void> {
    if (this.state.shareScreenEnabled) {
      this.props.infinityClient.stopPresenting()
      this.presentationStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.props.onLocalPresentationStream(this.presentationStream)
    } else {
      this.presentationStream = await navigator.mediaDevices.getDisplayMedia()
      this.presentationStream.getVideoTracks()[0].onended = () => {
        this.props.infinityClient.stopPresenting()
        this.props.onLocalPresentationStream(this.presentationStream)
      }
      this.props.infinityClient.present(this.presentationStream)
      this.props.onLocalPresentationStream(this.presentationStream)
    }
  }

  private toggleLockRoom (): void {

  }

  private togglePopOutVideo (): void {

  }

  private toggleSettings (): void {

  }

  componentDidMount (): void {
    this.props.callSignals.onPresentationConnectionChange.add((changeEvent: PresoConnectionChangeEvent): void => {
      if (changeEvent.send === 'connected') {
        this.setState({ shareScreenEnabled: true })
      } else {
        this.setState({ shareScreenEnabled: false })
      }
    })
  }

  render (): JSX.Element {
    return (
      <div className="Toolbar" data-testid='Toolbar'>
        <ToolbarButton icon={shareScreenIcon} toolTip={this.state.shareScreenEnabled ? 'Stop Sharing Screen' : 'Share Screen'}
          selected={this.state.shareScreenEnabled}
          onClick={this.toggleShareScreen}
        />
        <ToolbarButton icon={lockIcon} toolTip='Lock Room'
          selected={this.state.lockRoomEnabled}
          onClick={this.toggleLockRoom}
        />
        <ToolbarButton icon={popUpVideoIcon} toolTip='Pop Up Video'
          selected={this.state.popOutVideoEnabled}
          onClick={this.togglePopOutVideo}
        />
        <ToolbarButton icon={settingsIcon} toolTip='Open Settings'
          selected={this.state.settingsEnabled}
          onClick={this.toggleSettings}
        />
      </div>
    )
  }
}
