import { StreamQuality } from '@pexip/media-components'

const [auto, low, medium, high, veryHigh] = [0, 64, 1024, 2048, 6144]

/**
 * Convert from a bandwidth value (number) to a StreamQuality.
 * @param {number} bandwidth Value of for the bandwidth in kbps.
 * @returns {StreamQuality} The stream quality in one of the 5 values.
 */
const convertToStreamQuality = (bandwidth: number): StreamQuality => {
  switch (bandwidth) {
    case low:
      return StreamQuality.Low
    case medium:
      return StreamQuality.Medium
    case high:
      return StreamQuality.High
    case veryHigh:
      return StreamQuality.VeryHigh
    default:
      return StreamQuality.Auto
  }
}

/**
 * Convert from StreamQuality to the bandwidth value (number).
 * @param {StreamQuality} streamQuality The stream quality in one of the 5 values.
 * @returns {number} Value of the bandwidth in kbps.
 */
const convertToBandwidth = (streamQuality: StreamQuality): number => {
  switch (streamQuality) {
    case StreamQuality.Low:
      return low
    case StreamQuality.Medium:
      return medium
    case StreamQuality.High:
      return high
    case StreamQuality.VeryHigh:
      return veryHigh
    default:
      return auto
  }
}

/**
 * Save the stream quality in the local storage.
 * @param {StreamQuality} streamQuality The stream quality in one of the 5 values.
 */
// const setStreamQuality = (streamQuality: StreamQuality): void => {
//   localStorage.setItem('pexipStreamQuality', streamQuality)
// }

// /**
//  * Retrieve the current stream quality from the local storage.
//  * @returns {StreamQuality} The stream quality in one of the 5 values.
//  */
// const getStreamQuality = (): StreamQuality => {
//   return localStorage.getItem('pexipStreamQuality') as StreamQuality ?? 'auto'
// }

export {
  convertToStreamQuality,
  convertToBandwidth
  // setStreamQuality,
  // getStreamQuality
}
