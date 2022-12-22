import React, { RefObject, useState } from 'react'

import { DraggableFoldableInMeetingSelfview, Stats } from '@pexip/media-components'
import { Quality } from '@pexip/peer-connection-stats'
import { CallSignals } from '@pexip/infinity'

import './Selfview.scss'

interface SelfViewProps {
  floatRoot: RefObject<HTMLDivElement>
  callSignals: CallSignals
  username: string
  localStream: MediaStream
}

export function Selfview (props: SelfViewProps): JSX.Element {
  const [showStats, setShowStats] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [folded, setFolded] = useState(false)

  return (
    <div className='Selfview'>
      <DraggableFoldableInMeetingSelfview
        floatRoot={props.floatRoot}
        shouldShowUserAvatar={false}
        username={props.username}
        localMediaStream={props.localStream}
        quality={Quality.BAD}
        onCollapseSelfview={() => setFolded(true)}
        onExpandSelfview={() => setFolded(false)}
        isFolded={folded}
        showSelfviewTooltip={showTooltip}
        setShowSelfviewTooltip={(showTooltip: boolean) => setShowTooltip(showTooltip)}
        onCallQualityClick={() => setShowStats(true)}
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
      />
      { showStats &&
        <Stats
          onClose={() => setShowStats(false)}
          statsSignal={props.callSignals.onRtcStats}
          callQualityStatsSignal={(props.callSignals.onCallQualityStats)}
        /> }
    </div>
  )
}

export default Selfview
