import React from 'react'

const mediaComponentsMock = {
  DevicesList: () => <div />,
  SelfViewSettings: (props: any) => {
    const { mediaStream, ...newProps } = props
    return <div {...newProps} className='selfview' />
  },
  StreamQuality: jest.fn()
}

module.exports = mediaComponentsMock
