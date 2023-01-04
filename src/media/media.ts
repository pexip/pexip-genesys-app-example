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
      localStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId, height: 720 } })
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

export {
  getLocalStream,
  stopStream
}
