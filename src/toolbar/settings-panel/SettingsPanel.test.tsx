import React from 'react'

import { screen, render, act } from '@testing-library/react'
import '../../__mocks__/mediaDevices'

import { SettingsPanel } from './SettingsPanel'
import { setCurrentDeviceId } from '../../media/media'

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
      const selfview = screen.getByTestId('selfview')
      expect(selfview).toBeInTheDocument()
    })
  })

  describe('Devices selector component', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should render', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const devicesList = screen.getByTestId('devices-list')
      expect(devicesList).toBeInTheDocument()
    })

    it('should display a list of all available devices in a select HTML element', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const devicesList = screen.getByTestId('devices-list')
      const options = devicesList.getElementsByTagName('option')
      expect(options.length).toBeGreaterThanOrEqual(2)
    })

    it('should only display the video devices', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const devicesList = screen.getByTestId('devices-list')
      const options = devicesList.getElementsByTagName('option')
      const devices = await navigator.mediaDevices.enumerateDevices()
      for (let i = 0; i < options.length; i++) {
        const device = devices.find((device) => device.deviceId === options[i].value)
        expect(device).toBeDefined()
        expect(device?.kind).toBe('videoinput')
      }
    })

    it('should select the first camera if localStorage empty', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const devicesList = screen.getByTestId('devices-list')
      expect((devicesList as HTMLSelectElement).selectedIndex).toBe(0)
    })

    it('should select the camera of the localStorage if any', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const device = devices.filter((device) => device.kind === 'videoinput')[1]
      setCurrentDeviceId(device.deviceId)
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const devicesList = screen.getByTestId('devices-list')
      expect((devicesList as HTMLSelectElement).selectedIndex).toBe(1)
    })
  })

  // describe('Effect selector component', () => {

  // })

  // describe('Connection quality component', () => {

  // })
})
