import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNs: 'translation'
    resources: {
      translation: Record<string, string>
    }
  }
}
