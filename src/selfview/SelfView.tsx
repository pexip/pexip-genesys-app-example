import React, { type RefObject, useState } from 'react'
import {
  DraggableFoldableInMeetingSelfview,
  type StreamQuality,
  useCallQuality
} from '@pexip/media-components'
import { type CallSignals } from '@pexip/infinity'
import { LocalStorageKey } from '../types/LocalStorageKey'

import './SelfView.scss'

interface SelfViewProps {
  floatRoot: RefObject<HTMLDivElement>
  callSignals: CallSignals
  username: string
  localStream: MediaStream | undefined
  onCameraMuteChanged: (muted: boolean) => Promise<void>
}

export const SelfView = React.memo((props: SelfViewProps): JSX.Element => {
  const [showTooltip, setShowTooltip] = useState(true)
  const [folded, setFolded] = useState(false)

  const callQuality = useCallQuality({
    getStreamQuality: () =>
      localStorage.getItem(LocalStorageKey.StreamQuality) as StreamQuality,
    callQualitySignal: props.callSignals.onCallQuality
  })

  return (
    <div className="SelfView" data-testid="SelfView">
      <DraggableFoldableInMeetingSelfview
        floatRoot={props.floatRoot}
        shouldShowUserAvatar={false}
        username={props.username}
        localMediaStream={props.localStream}
        onCollapseSelfview={() => {
          setFolded(true)
        }}
        onExpandSelfview={() => {
          setFolded(false)
        }}
        isFolded={props.localStream == null || folded}
        showSelfviewTooltip={showTooltip}
        setShowSelfviewTooltip={(showTooltip: boolean) => {
          setShowTooltip(showTooltip)
        }}
        // Unused parameters
        quality={callQuality}
        isAudioInputMuted={true}
        isVideoInputMuted={props.localStream == null}
        onToggleAudioClick={() => {}}
        onToggleVideoClick={() => {
          props.onCameraMuteChanged(false).catch(console.error)
        }}
        isSidePanelVisible={true}
        autoHideProps={{
          onMouseEnter: () => {},
          onFocus: () => {},
          onMouseLeave: () => {},
          onBlur: () => {}
        }}
        areEffectsEnabled={false}
        areEffectsApplied={false}
        openEffectsModal={() => {}}
        draggableAriaLabel={''}
        isMirrored={true}
        isAudioInputMissing={false}
      />
    </div>
  )
})

SelfView.displayName = 'Selfview'
