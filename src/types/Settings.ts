import { MediaDeviceInfoLike } from '@pexip/media-control'
import { Effect } from './Effect'
import { StreamQuality } from '@pexip/media-components'

export interface Settings {
  device: MediaDeviceInfoLike
  effect: Effect
  streamQuality: StreamQuality
}
