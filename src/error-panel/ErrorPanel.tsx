import React from 'react'

import { Button, Modal } from '@pexip/components'

import './ErrorPanel.scss'

interface ErrorMessageProps {
  title: string
  message: string
  onClick?: () => void
}

export function ErrorPanel (props: ErrorMessageProps): JSX.Element {
  return (
    <Modal isOpen={true} className='ErrorPanel' data-testid='ErrorPanel'>
      <h3>{props.title}</h3>
      <p>{props.message}</p>
      { props.onClick != null && <Button onClick={() => { if (props.onClick != null) props.onClick() }}>Try again</Button>}
    </Modal>
  )
}
