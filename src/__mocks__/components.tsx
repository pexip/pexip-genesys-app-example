const componentsMock = {
  Bar: (props: any) => <div {...props}>{props.children}</div>,
  Box: (props: any) => <div {...props}>{props.children}</div>,
  Button: (props: any) => <button {...props} />,
  CenterLayout: (props: any) => <div>{props.children}</div>,
  FontVariant: jest.fn(),
  Icon: (props: any) => {
    const { colorScheme, ...newProps } = props
    return <div {...newProps} />
  },
  IconTypes: { IconBlock: 'Icon' },
  InteractiveElement: (props: any) => (
    <button {...props}>{props.children}</button>
  ),
  Modal: (props: any) => {
    const { isOpen, withCloseButton, ...newProps } = props
    return <div {...newProps}>{props.children}</div>
  },
  NotificationToast: (props: any) => <div {...props}>{props.children}</div>,
  Select: (props: any) => {
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
  },
  Spinner: (props: any) => {
    const { colorScheme, ...newProps } = props
    return <div {...newProps}></div>
  },
  Text: (props: any) => {
    // Remove htmlTag from the props
    const { htmlTag, ...newProps } = props
    return <div {...newProps}>{props.children}</div>
  },
  TextHeading: (props: any) => <h3>{props.text}</h3>,
  Video: () => <div />
}

module.exports = componentsMock
