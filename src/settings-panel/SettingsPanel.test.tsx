{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

import React from 'react'

import '../__mocks__/test-params'

import { screen, render, act } from '@testing-library/react'

import { SettingsPanel } from './SettingsPanel'
import { setCurrentDeviceId } from '../media/media'
import { StreamQuality } from '@pexip/media-components'
import { setStreamQuality } from '../media/quality'
import { setCurrentEffect } from '../media/processor'

import '../__mocks__/mediaDevices'

jest.mock('react-i18next', () => {
  return require('../__mocks__/reacti18next')
})

jest.mock('@pexip/components', () => {
  return require('../__mocks__/components')
})

jest.mock('@pexip/media-components', () => {
  return require('../__mocks__/media-components')
})

jest.mock('@pexip/media-processor', () => {
  return require('../__mocks__/media-processor')
}, { virtual: true })

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

  describe('Effect selector component', () => {
    it('should render 3 buttons', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const effects = screen.getAllByTestId('Effect')
      expect(effects.length).toBe(3)
    })

    it('should mark "none" as active when click on the button and the rest inactive', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      await act(() => {
        const effects = screen.getAllByTestId('Effect')
        const none = effects[0]
        none.getElementsByTagName('button')[0].click()
      })
      const effects = await screen.getAllByTestId('Effect')
      const none = effects[0]
      const blur = effects[1]
      const overlay = effects[2]
      expect(none.getElementsByClassName('active').length).toBe(1)
      expect(blur.getElementsByClassName('active').length).toBe(0)
      expect(overlay.getElementsByClassName('active').length).toBe(0)
    })

    it('should mark "blur" as active when click on the button and the rest inactive', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      await act(() => {
        const effects = screen.getAllByTestId('Effect')
        const blur = effects[1]
        blur.getElementsByTagName('button')[0].click()
      })
      const effects = await screen.getAllByTestId('Effect')
      const none = effects[0]
      const blur = effects[1]
      const overlay = effects[2]
      expect(none.getElementsByClassName('active').length).toBe(0)
      expect(blur.getElementsByClassName('active').length).toBe(1)
      expect(overlay.getElementsByClassName('active').length).toBe(0)
    })

    it('should mark "overlay" as active when click on the button and the rest inactive', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      await act(() => {
        const effects = screen.getAllByTestId('Effect')
        const overlay = effects[2]
        overlay.getElementsByTagName('button')[0].click()
      })
      const effects = await screen.getAllByTestId('Effect')
      const none = effects[0]
      const blur = effects[1]
      const overlay = effects[2]
      expect(none.getElementsByClassName('active').length).toBe(0)
      expect(blur.getElementsByClassName('active').length).toBe(0)
      expect(overlay.getElementsByClassName('active').length).toBe(1)
    })

    it('should select the "none" effect if localStorage empty', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const effects = await screen.getAllByTestId('Effect')
      const none = effects[0]
      const blur = effects[1]
      const overlay = effects[2]
      expect(none.getElementsByClassName('active').length).toBe(1)
      expect(blur.getElementsByClassName('active').length).toBe(0)
      expect(overlay.getElementsByClassName('active').length).toBe(0)
    })

    it('should select the effect of the localStorage if any', async () => {
      setCurrentEffect('blur')
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const effects = await screen.getAllByTestId('Effect')
      const none = effects[0]
      const blur = effects[1]
      const overlay = effects[2]
      expect(none.getElementsByClassName('active').length).toBe(0)
      expect(blur.getElementsByClassName('active').length).toBe(1)
      expect(overlay.getElementsByClassName('active').length).toBe(0)
    })
  })

  describe('Connection quality component', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should render', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const settingsPanel = screen.getByTestId('SettingsPanel')
      const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
      expect(qualityList).toBeDefined()
    })

    it('should have 5 options (one per stream quality)', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const settingsPanel = screen.getByTestId('SettingsPanel')
      const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
      const options = qualityList.getElementsByTagName('option')
      expect(options.length).toBe(5)
    })

    it('should have the value with the stream quality ID', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const settingsPanel = screen.getByTestId('SettingsPanel')
      const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
      const options = qualityList.getElementsByTagName('option')
      const low = options[0]
      const medium = options[1]
      const high = options[2]
      const veryHigh = options[3]
      const auto = options[4]
      expect(low.value).toBe(StreamQuality.Low)
      expect(medium.value).toBe(StreamQuality.Medium)
      expect(high.value).toBe(StreamQuality.High)
      expect(veryHigh.value).toBe(StreamQuality.VeryHigh)
      expect(auto.value).toBe(StreamQuality.Auto)
    })

    it('should have the text with the stream quality label', async () => {
      await act(() => {
        render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
      })
      const settingsPanel = screen.getByTestId('SettingsPanel')
      const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
      const options = qualityList.getElementsByTagName('option')
      const low = options[0]
      const medium = options[1]
      const high = options[2]
      const veryHigh = options[3]
      const auto = options[4]
      expect(low.innerHTML).toBe('Low')
      expect(medium.innerHTML).toBe('Medium')
      expect(high.innerHTML).toBe('High')
      expect(veryHigh.innerHTML).toBe('Very High')
      expect(auto.innerHTML).toBe('Auto')
    })
  })

  it('should select the auto stream quality if empty', async () => {
    await act(() => {
      render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
    })
    const settingsPanel = screen.getByTestId('SettingsPanel')
    const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
    expect((qualityList as HTMLSelectElement).selectedIndex).toBe(4)
  })

  it('should select the stream quality of the localStorage if any', async () => {
    setStreamQuality(StreamQuality.Medium)
    await act(() => {
      render(<SettingsPanel onClose={handleCloseMock} onSave={handleSaveMock} />)
    })
    const settingsPanel = screen.getByTestId('SettingsPanel')
    const qualityList = settingsPanel.getElementsByClassName('QualityList')[0]
    expect((qualityList as HTMLSelectElement).selectedIndex).toBe(1)
  })
})
