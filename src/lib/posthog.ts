// lib/posthog.ts
import posthog from 'posthog-js'

let isPostHogInitialized = false

export function initPostHog() {
  if (typeof window !== 'undefined' && !isPostHogInitialized) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://us.i.posthog.com',
    })
    isPostHogInitialized = true
  }
}

export { posthog }
