const mediaComponentsMock = {
  DevicesList: (props: any) => {
    const {
      audioInputError,
      videoInputError,
      onAudioInputChange,
      onAudioOutputChange,
      onVideoInputChange,
      videoInput,
      setShowHelpVideo,
      ...newProps
    } = props
    return (
      <select {...newProps} value={videoInput?.deviceId}>
        {props.devices.map((device: any) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    )
  },
  SelfViewSettings: (props: any) => {
    const { mediaStream, ...newProps } = props
    return <div {...newProps} className="selfview" />
  },
  StreamQuality: {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    VeryHigh: 'very-high',
    Auto: 'auto'
  }
}

module.exports = mediaComponentsMock
