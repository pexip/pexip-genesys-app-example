// Copyright 2024 Pexip AS
//
// SPDX-License-Identifier: Apache-2.0

import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNs: 'translation'
    resources: {
      translation: Record<string, string>
    }
  }
}
