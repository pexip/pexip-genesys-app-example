import React from 'react'
import { Video } from './video/Video'
import { Toolbar } from './toolbar/Toolbar'

import './App.scss'

import Draggable from 'react-draggable'

interface AppState {
  localStream: MediaStream
  remoteStream: MediaStream
  presentationStream: MediaStream
}

class App extends React.Component<{}, AppState> {
  // TODO: We should receive the following information in the query parameters:
  //  - pcEnvironment (Genesys Cloud Region)
  //  - pcConversationId
  //  - PexipNodeUrl
  //  - PexipAgentPin

  private readonly selfViewRef = React.createRef<HTMLDivElement>()

  constructor (props: {}) {
    super(props)
    this.state = {
      localStream: new MediaStream(),
      remoteStream: new MediaStream(),
      presentationStream: new MediaStream()
    }
    // Workaround for maintain the selfView in the viewport when resizing
    window.addEventListener('resize', () => this.simulateSelfViewClick())
  }

  // Workaround for maintain the selfView in the viewport when resizing
  private simulateSelfViewClick (): void {
    this.selfViewRef.current?.dispatchEvent(new Event('mouseover', { bubbles: true }))
    this.selfViewRef.current?.dispatchEvent(new Event('mousedown', { bubbles: true }))
    setTimeout(() => {
      this.selfViewRef.current?.dispatchEvent(new Event('mousemove', { bubbles: true }))
      this.selfViewRef.current?.dispatchEvent(new Event('mouseup', { bubbles: true }))
    }, 100)
  }

  // TODO: Remove this. It's is only for testing.
  async componentDidMount (): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    this.setState({
      localStream: stream,
      remoteStream: stream,
      presentationStream: stream
    })
  }

  render (): JSX.Element {
    return (
      <div className="App" data-testid='App'>
        <div className="videos-container">
          <Video mediaStream={this.state.remoteStream}/>
          <Video mediaStream={this.state.presentationStream} objectFit='contain' />
        </div>
        <Draggable bounds='parent'>
          <div className='self-view' ref={this.selfViewRef}>
            <Video mediaStream={this.state.localStream} flip={true}/>
          </div>
        </Draggable>
        <Toolbar />
      </div>
    )
  }
}

export default App
