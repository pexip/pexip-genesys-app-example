const mediaComponentsMock = {
  DeviceSelect: (props: any) => {
    const {
      isDisabled,
      mediaDeviceInfoLike,
      onDeviceChange,
      iconType,
      ...newProps
    } = props
    return (
      <select {...newProps} value={mediaDeviceInfoLike?.deviceId}>
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
