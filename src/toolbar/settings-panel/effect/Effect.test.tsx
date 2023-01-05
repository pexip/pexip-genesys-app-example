import React from 'react'

import { screen, render } from '@testing-library/react'
import { IconTypes } from '@pexip/components'

import { Effect } from './Effect'

jest.mock('@pexip/components', () => {
  return {
    Icon: (props: any) => {
      const { colorScheme, ...newProps } = props
      return <div {...newProps}/>
    },
    InteractiveElement: (props: any) => {
      return <div {...props}/>
    },
    Box: (props: any) => {
      return <div {...props}/>
    },
    Text: (props: any) => {
      // Remove htmlTag from the props
      const { htmlTag, ...newProps } = props
      return <div {...newProps}>{props.children}</div>
    },
    IconTypes: { IconBlock: 'Icon' }
  }
})

describe('SettingsPanel component', () => {
  const handleClick = jest.fn()

  beforeEach(() => {
    handleClick.mockReset()
  })

  it('should render', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false} />
    )
    const effect = screen.getByTestId('Effect')
    expect(effect).toBeInTheDocument()
  })

  it('should not display an icon or background if no "iconSource" or "bgImageUrl" provided', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false} />
    )
    const effect = screen.getByTestId('Effect')
    const icon = effect.getElementsByClassName('icon')[0]
    const background = effect.getElementsByClassName('background')[0]
    expect(icon).toBeUndefined()
    expect(background).toBeUndefined()
  })

  it('should display an icon if "iconSource" provided, but not background', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false}
      iconSource={IconTypes.IconBlock} />
    )
    const effect = screen.getByTestId('Effect')
    const icon = effect.getElementsByClassName('icon')[0]
    const background = effect.getElementsByClassName('background')[0]
    expect(icon).toBeInTheDocument()
    expect(background).toBeUndefined()
  })

  it('should display background if "bgImageUrl" provided, but not an icon', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false}
      bgImageUrl='https://pexip.com/background.jpg' />
    )
    const effect = screen.getByTestId('Effect')
    const icon = effect.getElementsByClassName('icon')[0]
    const background = effect.getElementsByClassName('background')[0]
    expect(icon).toBeUndefined()
    expect(background).toBeInTheDocument()
  })

  it('should have the "name" in the Text element', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false} />
    )
    const effect = screen.getByTestId('Effect')
    const label = effect.getElementsByClassName('label')[0]
    expect(label).toHaveTextContent('label')
  })

  it('should trigger "onClick" when the effect is pressed', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false} />
    )
    const effect = screen.getByTestId('Effect')
    const button = effect.getElementsByClassName('button')[0] as HTMLElement
    button.click()
    expect(handleClick).toBeCalledTimes(1)
  })

  it('should remove the class "active" in the "Box" element when "active" is false', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={false} />
    )
    const effect = screen.getByTestId('Effect')
    const box = effect.getElementsByClassName('box')[0]
    expect(box).not.toHaveClass('active')
  })

  it('should add the class "active" in the "Box" element when "active" is true', () => {
    render(<Effect
      name='label'
      onClick={handleClick}
      active={true} />
    )
    const effect = screen.getByTestId('Effect')
    const box = effect.getElementsByClassName('box')[0]
    expect(box).toHaveClass('active')
  })
})
