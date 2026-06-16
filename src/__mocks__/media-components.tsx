import type React from 'react'

export const DeviceSelect = (props: any): React.JSX.Element => {
  const { isDisabled, selected, onDeviceChange, iconType, ...newProps } = props
  return (
    <select {...newProps} value={selected?.deviceId}>
      {props.devices.map((device: any) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label}
        </option>
      ))}
    </select>
  )
}
export const SelfViewSettings = (props: any): React.JSX.Element => {
  const { localMediaStream, isVideoInputMuted, deviceStatusInfo, ...newProps } =
    props
  return <div {...newProps} className="selfview" />
}
export const StreamQuality = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  VeryHigh: 'very-high',
  Auto: 'auto'
}
