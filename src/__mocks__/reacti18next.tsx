import React from 'react'

const reactI18Next = {
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string, defaultStr: string) => defaultStr ?? str,
      i18n: {
        changeLanguage: async () => await new Promise(() => {})
      }
    }
  },
  Trans: () => <span />
}

module.exports = reactI18Next
