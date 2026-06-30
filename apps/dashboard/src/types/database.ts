import type { Models } from 'appwrite'

export type Plan = Models.Document & {
  name: string
  price: number
  messageQuota: number
}

export type Business = Models.Document & {
  ownerId: string
  name: string
  widgetKey: string
  allowedDomains: string[]
  widgetConfig: string
}
