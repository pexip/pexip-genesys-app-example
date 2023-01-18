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
      <div className='container'>{
        props.message.split('\n').map(
          (paragraph, index) => <p key={index}>{paragraph}</p>
        )}
      </div>
      { props.onClick != null && <Button onClick={() => { if (props.onClick != null) props.onClick() }}>Try again</Button>}
    </Modal>
  )
}
