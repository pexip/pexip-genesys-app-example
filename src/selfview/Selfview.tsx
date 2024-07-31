import React, { RefObject, useState } from 'react'

import {
  DraggableFoldableInMeetingSelfview,
  Stats,
  useCallQuality,
  useNetworkState
} from '@pexip/media-components'
import { CallSignals } from '@pexip/infinity'

import { getStreamQuality } from '../media/quality'

import './Selfview.scss'

interface SelfViewProps {
  floatRoot: RefObject<HTMLDivElement>
  callSignals: CallSignals
  username: string
  localStream: MediaStream
}

export const Selfview = React.memo((props: SelfViewProps): JSX.Element => {
  const [showStats, setShowStats] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [folded, setFolded] = useState(false)

  // const networkState = useNetworkState(
  //   callLivenessSignals.onReconnecting,
  //   callLivenessSignals.onReconnected
  // )

  const callQuality = useCallQuality({
    getStreamQuality,
    callQualitySignal: props.callSignals.onCallQuality
  })

  return (
    <div className="Selfview" data-testid="Selfview">
      <DraggableFoldableInMeetingSelfview
        floatRoot={props.floatRoot}
        shouldShowUserAvatar={false}
        username={props.username}
        localMediaStream={props.localStream}
        quality={callQuality}
        onCollapseSelfview={() => setFolded(true)}
        onExpandSelfview={() => setFolded(false)}
        isFolded={folded}
        showSelfviewTooltip={showTooltip}
        setShowSelfviewTooltip={(showTooltip: boolean) =>
          setShowTooltip(showTooltip)
        }
        // onCallQualityClick={() => setShowStats(true)}
        // Unused parameters
        callQualityPosition={'bottomRight'}
        isAudioInputMuted={true}
        isVideoInputMuted={false}
        onToggleAudioClick={() => {}}
        onToggleVideoClick={() => {}}
        isSidePanelVisible={false}
        autoHideProps={{
          onMouseEnter: () => {},
          onFocus: () => {},
          onMouseLeave: () => {},
          onBlur: () => {}
        }}
        areEffectsEnabled={false}
        areEffectsApplied={false}
        openEffectsModal={function (): void {
          throw new Error('Function not implemented.')
        }}
        draggableAriaLabel={''}
      />
      {showStats && (
        <Stats
          data-testid="Stats"
          onClose={() => setShowStats(false)}
          statsSignal={props.callSignals.onRtcStats}
          callQualityStatsSignal={props.callSignals.onCallQualityStats}
          cachedStats={undefined}
        />
      )}
    </div>
  )
})

Selfview.displayName = 'Selfview'
