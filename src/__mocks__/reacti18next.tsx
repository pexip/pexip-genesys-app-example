{/*
Copyright 2024 Pexip AS

SPDX-License-Identifier: Apache-2.0
*/}

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
  Trans: () => <span />
}

module.exports = reactI18Next
