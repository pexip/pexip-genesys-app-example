import React from 'react'

import { screen, render, act } from '@testing-library/react'

import { SettingsPanel } from './SettingsPanel'

jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: async () => await new Promise(() => {})
      }
    }
  },
  Trans: () => <span />
}))

jest.mock('@pexip/media-components', () => {
  return {
    DevicesList: () => <div />,
    SelfViewSettings: () => <div />,
    StreamQuality: jest.fn()
  }
})
jest.mock('@pexip/components', () => {
  return {
    Modal: (props: any) => <div data-testid='SettingsPanel'>{props.children}</div>,
    Bar: (props: any) => <div>{props.children}</div>,
    Box: (props: any) => <div>{props.children}</div>,
    Button: () => <button />,
    Select: () => <select />,
    TextHeading: (props: any) => <h3>{props.text}</h3>,
    Text: (props: any) => <span>{props.text}</span>,
    InteractiveElement: (props: any) => <button>{props.children}</button>,
    IconTypes: jest.fn(),
    FontVariant: jest.fn()
  }
})
jest.mock('@pexip/media-processor', () => {}, { virtual: true })

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    enumerateDevices: async () => {
      return await new Promise<any[]>(resolve => {
        resolve([])
      })
    },
    getUserMedia: async () => {
      return await new Promise<MediaStream>(resolve => {
        resolve(new MediaStream())
      })
    }
  }
})

beforeAll(() => {
  window.MediaStream = jest.fn().mockImplementation(() => ({
    addTrack: jest.fn()
    // Add any method you want to mock
  }))
})

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
})
