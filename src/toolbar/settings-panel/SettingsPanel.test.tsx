import React from 'react'

import { screen, render, act } from '@testing-library/react'
import '../../__mocks__/mediaDevices'

import { SettingsPanel } from './SettingsPanel'

jest.mock('react-i18next', () => {
  return require('../../__mocks__/reacti18next')
})

jest.mock('@pexip/components', () => {
  return require('../../__mocks__/components')
})

jest.mock('@pexip/media-components', () => {
  return require('../../__mocks__/media-components')
})

jest.mock('@pexip/media-processor', () => {}, { virtual: true })

const handleCloseMock = jest.fn()
const handleSaveMock = jest.fn()

describe('SettingsPanel component', () => {
  it('should render', async () => {
    await act(() => {
      render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
    })
    const settingsPanel = screen.getByTestId('SettingsPanel')
    expect(settingsPanel).toBeInTheDocument()
  })

  describe('Selfview preview component', () => {
    it('should display a video preview with the localStream', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const settingsPanel = screen.getByTestId('SettingsPanel')
      const selfview = settingsPanel.getElementsByClassName('selfview')[0]
      expect(selfview).toBeInTheDocument()
      // const mediaStream = selfview.p
      // expect(selfview).to
    })
  })

  describe('Devices selector component', () => {
    it('should display a list of all available devices in a select HTML element', () => {

    })
  })

  describe('Effect selector component', () => {

  })

  describe('Connection quality component', () => {

  })
})
