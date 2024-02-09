{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

import React from 'react'

import { Button, Modal } from '@pexip/components'

import './ErrorPanel.scss'
import { useTranslation } from 'react-i18next'

interface ErrorMessageProps {
  errorId: string
  onClick?: () => void
}

export function ErrorPanel (props: ErrorMessageProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Modal isOpen={true} className='ErrorPanel' data-testid='ErrorPanel'>
      <h3>{t(`${props.errorId}.title`)}</h3>
      <div className='container'>{
        t(`${props.errorId}.message`).split('\n').map(
          (paragraph, index) => <p key={index}>{paragraph}</p>
        )}
      </div>
      { props.onClick != null && <Button onClick={() => { if (props.onClick != null) props.onClick() }}>Try again</Button>}
    </Modal>
  )
}
