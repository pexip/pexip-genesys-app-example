import React from 'react'
import {
  CallSignals,
  InfinitySignals,
  InfinityClient,
  PresoConnectionChangeEvent
} from '@pexip/infinity'
import { SettingsPanel } from '../settings-panel/SettingsPanel'
import copy from 'copy-to-clipboard'
import { toast } from 'react-toastify'
import { InfinityContext } from '../App'
import { StreamQuality } from '@pexip/media-components'
import { Button, Icon, IconTypes, Tooltip } from '@pexip/components'

import './Toolbar.scss'

interface ToolbarProps {
  infinityClient: InfinityClient
  infinityContext: InfinityContext
  callSignals: CallSignals
  infinitySignals: InfinitySignals
  onLocalPresentationStream: Function
  onLocalStream: Function
  isCameraMuted: boolean
  onCameraMute: () => Promise<void>
  onChangeStreamQuality: (streamQuality: StreamQuality) => void
}

interface ToolbarState {
  shareScreenEnabled: boolean
  lockRoomEnabled: boolean
  popOutVideoEnabled: boolean
  settingsEnabled: boolean
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
  private presentationStream!: MediaStream
  private readonly copy = copy
  constructor(props: ToolbarProps) {
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
    this.copyInvitationLink = this.copyInvitationLink.bind(this)
  }

  private async toggleShareScreen(): Promise<void> {
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

  private async toggleLockRoom(): Promise<void> {
    const response = await this.props.infinityClient.lock({
      lock: this.state.lockRoomEnabled
    })
    if (response?.status === 200) {
      this.setState({
        lockRoomEnabled: !this.state.lockRoomEnabled
      })
    }
  }

  private async togglePopOutVideo(): Promise<void> {
    const videoElement = document.getElementById(
      'remoteVideo'
    ) as HTMLVideoElement
    if (videoElement === undefined) {
      return
    }
    if (document.pictureInPictureElement != null) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      await videoElement.requestPictureInPicture()
      this.setState({ popOutVideoEnabled: true })
    }
  }

  private toggleSettings(): void {
    this.setState({ settingsEnabled: !this.state.settingsEnabled })
  }

  private async copyInvitationLink(): Promise<void> {
    // Example: https://pexipdemo.com/webapp/m/=mp7b6f680324ee40df8d762fdc24b54849/step-by-step?role=guest
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/restrict-plus-operands
    const infinityContext = this.props.infinityContext
    const invitationlink: string = `https://${infinityContext.infinityHost}/webapp/m/${infinityContext.pexipAppPrefix}${infinityContext.conferenceAlias}/step-by-step?role=guest`
    this.copy(invitationlink)
    toast('Invitation link copied to clipboard!')
  }

  public async stopScreenShare(): Promise<void> {
    if (this.state.shareScreenEnabled) {
      await this.toggleShareScreen()
    }
  }

  componentDidMount(): void {
    const videoElement = document.getElementById(
      'remoteVideo'
    ) as HTMLVideoElement
    // Add listener for natvive pop out events for cusomer video element
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (videoElement) {
      videoElement.addEventListener('enterpictureinpicture', () =>
        this.setState({ popOutVideoEnabled: true })
      )
      videoElement.addEventListener('leavepictureinpicture', () =>
        this.setState({ popOutVideoEnabled: false })
      )
    }
    this.props.callSignals.onPresentationConnectionChange.add(
      (changeEvent: PresoConnectionChangeEvent): void => {
        console.log('onPresentationConnectionChange')
        if (changeEvent.send === 'connected') {
          this.setState({ shareScreenEnabled: true })
        } else {
          this.setState({ shareScreenEnabled: false })
        }
      }
    )
    // Handle lock room context
    // this.setState({
    //   lockRoomEnabled: !(
    //     this.props.infinityClient.conferenceStatus?.locked ?? false
    //   )
    // })
    // this.props.infinitySignals.onConferenceStatus.add(
    //   (conferenceStatus: ConferenceStatus): void => {
    //     this.setState({ lockRoomEnabled: !conferenceStatus.locked })
    //   }
    // )
  }

  render(): JSX.Element {
    return (
      <>
        <div className="Toolbar" data-testid="Toolbar">
          <Tooltip
            text={this.props.isCameraMuted ? 'Unmute camera' : 'Mute camera'}
          >
            <Button
              onClick={this.props.onCameraMute}
              modifier="square"
              variant={this.props.isCameraMuted ? 'danger' : 'translucent'}
            >
              <Icon
                source={
                  this.props.isCameraMuted
                    ? IconTypes.IconVideoOff
                    : IconTypes.IconVideoOn
                }
              />
            </Button>
          </Tooltip>

          <Tooltip
            text={
              this.state.shareScreenEnabled
                ? 'Stop sharing screen'
                : 'Share screen'
            }
          >
            <Button
              onClick={this.toggleShareScreen}
              modifier="square"
              variant={this.state.shareScreenEnabled ? 'danger' : 'translucent'}
            >
              <Icon source={IconTypes.IconPresentationOn} />
            </Button>
          </Tooltip>

          <Tooltip
            text={this.state.lockRoomEnabled ? 'Unlock room' : 'Lock room'}
          >
            <Button
              onClick={this.toggleLockRoom}
              modifier="square"
              variant={this.state.lockRoomEnabled ? 'danger' : 'translucent'}
            >
              <Icon
                source={
                  this.state.lockRoomEnabled
                    ? IconTypes.IconLock
                    : IconTypes.IconUnlock
                }
              />
            </Button>
          </Tooltip>

          <Tooltip
            text={
              this.state.popOutVideoEnabled ? 'Return video' : 'Pop out video'
            }
          >
            <Button
              onClick={this.togglePopOutVideo}
              modifier="square"
              variant={this.state.popOutVideoEnabled ? 'danger' : 'translucent'}
            >
              <Icon source={IconTypes.IconOpenInNew} />
            </Button>
          </Tooltip>

          <Tooltip text="Copy invitation link">
            <Button
              onClick={this.copyInvitationLink}
              modifier="square"
              variant="translucent"
            >
              <Icon source={IconTypes.IconLink} />
            </Button>
          </Tooltip>

          <Tooltip text="Open settings">
            <Button
              onClick={this.toggleSettings}
              modifier="square"
              variant={this.state.settingsEnabled ? 'danger' : 'translucent'}
            >
              <Icon source={IconTypes.IconSettings} />
            </Button>
          </Tooltip>
        </div>
        {this.state.settingsEnabled && (
          <SettingsPanel
            onClose={() => this.setState({ settingsEnabled: false })}
            onSave={(
              localStream?: MediaStream,
              streamQuality?: StreamQuality
            ) => {
              this.setState({ settingsEnabled: false })
              if (localStream != null) {
                this.props.onLocalStream(localStream)
              }
              if (streamQuality != null) {
                this.props.onChangeStreamQuality(streamQuality)
              }
            }}
          />
        )}
      </>
    )
  }
}
