import React from 'react'

const t = (str: string, defaultStr: string): string => defaultStr ?? str

const reactI18Next = {
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t,
      i18n: {
        changeLanguage: async () => await new Promise(() => {})
      }
    }
  },
  withTranslation: () => (Component: any) => {
    Component.defaultProps = { ...Component.defaultProps, t }
    return Component
  },
  Trans: () => <span />
}

module.exports = reactI18Next
