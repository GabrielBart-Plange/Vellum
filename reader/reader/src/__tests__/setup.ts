// Global test setup and type extensions
import '@testing-library/jest-dom'

if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    } as Response)
  ) as jest.Mock
}

if (!global.Response) {
  class ResponsePolyfill {
    ok: boolean
    status: number
    constructor(body?: unknown, init?: { status?: number }) {
      this.status = init?.status ?? 200
      this.ok = this.status >= 200 && this.status < 300
    }
  }
  ;(global as unknown as { Response: typeof ResponsePolyfill }).Response = ResponsePolyfill
}

if (!global.Headers) {
  class HeadersPolyfill {
    private map = new Map<string, string>()
    set(key: string, value: string) {
      this.map.set(key.toLowerCase(), value)
    }
    get(key: string) {
      return this.map.get(key.toLowerCase()) ?? null
    }
  }
  ;(global as unknown as { Headers: typeof HeadersPolyfill }).Headers = HeadersPolyfill
}

if (!global.Request) {
  class RequestPolyfill {
    url: string
    constructor(url: string) {
      this.url = url
    }
  }
  ;(global as unknown as { Request: typeof RequestPolyfill }).Request = RequestPolyfill
}

if (!(global as unknown as { BroadcastChannel?: unknown }).BroadcastChannel) {
  class BroadcastChannelPolyfill {
    name: string
    constructor(name: string) {
      this.name = name
    }
    postMessage(_: unknown) {}
    close() {}
  }
  ;(global as unknown as { BroadcastChannel: typeof BroadcastChannelPolyfill }).BroadcastChannel = BroadcastChannelPolyfill
}

// Extend Jest's expect matchers with testing-library matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: string): R
      toBeDisabled(): R
      toHaveClass(...classNames: string[]): R
      toBeEnabled(): R
      toHaveTextContent(text: string | RegExp): R
      toContainHTML(htmlText: string): R
      toHaveStyle(css: string | Record<string, unknown>): R
    }
  }
}

export {}
