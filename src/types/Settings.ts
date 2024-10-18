import { type MediaDeviceInfoLike } from '@pexip/media-control'
import { type Effect } from './Effect'
import { type StreamQuality } from '@pexip/media-components'

export interface Settings {
  device: MediaDeviceInfoLike
  effect: Effect
  streamQuality: StreamQuality
}
