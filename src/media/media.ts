import { StreamQuality } from '@pexip/media-components'

/**
 * Get a local video stream with the provided device id. If a device id is not provided
 * it will take the first video device.
 * @param {string} [deviceId] Device id to use for the video.
 * @param {boolean} [save=false] Indicates if the selected deviceID should be saved in the local storage.
 * @returns Local media stream.
 */
const getLocalStream = async (deviceId?: string | null, save: boolean = false): Promise<MediaStream> => {
  deviceId = deviceId ?? localStorage.getItem('pexipVideoInputId')
  let localStream: MediaStream
  if (deviceId !== null) {
    const device = (await navigator.mediaDevices.enumerateDevices()).find((device) => device.deviceId === deviceId)
    if (device !== null) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } })
    } else {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true })
    }
  } else {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true })
  }
  if (save && deviceId != null) {
    localStorage.setItem('pexipVideoInputId', deviceId)
  }
  return localStream
}

/**
 * Release any MediaStream in use.
 * @param {MediaStream} stream MediaStream to stop.
 */
const stopStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => track.stop())
}

/**
 * Get the current chosen stream quality.
 * TODO: For now it returns always auto.
 */
const getStreamQuality = (): StreamQuality => {
  const bandwidth = 'auto'
  const [low, medium, high, veryHigh] = ['576', '1264', '2464', '6144']

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

export {
  getLocalStream,
  stopStream,
  getStreamQuality
}
