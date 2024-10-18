import { Button, Modal } from '@pexip/components'

import './ErrorPanel.scss'

interface ErrorPanelProps {
  error: string
  onClick?: () => void
}

export function ErrorPanel(props: ErrorPanelProps): JSX.Element {
  return (
    <Modal isOpen={true} className="ErrorPanel" data-testid="ErrorPanel">
      <h3>Cannot connect</h3>
      <div className="container">
        <p>{props.error}</p>
      </div>
      {props.onClick != null && (
        <Button
          onClick={() => {
            if (props.onClick != null) props.onClick()
          }}
        >
          Try again
        </Button>
      )}
    </Modal>
  )
}
