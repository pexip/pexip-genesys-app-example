import type React from 'react'

export const Bar = (props: any): React.JSX.Element => (
  <div {...props}>{props.children}</div>
)
export const Box = (props: any): React.JSX.Element => (
  <div {...props}>{props.children}</div>
)
export const Button = (props: any): React.JSX.Element => <button {...props} />
export const CenterLayout = (props: any): React.JSX.Element => (
  <div>{props.children}</div>
)
export const FontVariant = jest.fn()
export const Icon = (props: any): React.JSX.Element => {
  const { colorScheme, ...newProps } = props
  return <div {...newProps} />
}
export const IconTypes = { IconBlock: 'Icon' }
export const InteractiveElement = (props: any): React.JSX.Element => (
  <button {...props}>{props.children}</button>
)
export const Modal = (props: any): React.JSX.Element => {
  const { isOpen, withCloseButton, ...newProps } = props
  return <div {...newProps}>{props.children}</div>
}
export const NotificationToast = (props: any): React.JSX.Element => (
  <div {...props}>{props.children}</div>
)
export const Select = (props: any): React.JSX.Element => {
  const {
    labelModifier,
    sizeModifier,
    onValueChange,
    isFullWidth,
    iconType,
    value,
    ...newProps
  } = props
  return (
    <select
      {...newProps}
      value={value ?? ''}
      onChange={(ev) => onValueChange(ev)}
    >
      {props.options.map((option: any) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
export const Spinner = (props: any): React.JSX.Element => {
  const { colorScheme, ...newProps } = props
  return <div {...newProps}></div>
}
export const Text = (props: any): React.JSX.Element => {
  // Remove htmlTag from the props
  const { htmlTag, ...newProps } = props
  return <div {...newProps}>{props.children}</div>
}
export const TextHeading = (props: any): React.JSX.Element => (
  <h3>{props.text}</h3>
)
export const Video = (): React.JSX.Element => <div />
