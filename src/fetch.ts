import type { IncomingMessage, ServerResponse } from 'node:http'
import getURL from 'requrl'
import send from '@polka/send-type'
import { splitCookiesString } from 'set-cookie-parser'

export function createNodeHeaders(requestHeaders: IncomingMessage['headers']): Headers {
  const headers = new Headers()

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values)
          headers.append(key, value)
      }
      else {
        headers.set(key, values)
      }
    }
  }

  return headers
}

export function createNodeRequest(req: IncomingMessage): Request {
  const origin = getURL(req)
  const url = new URL(req.url as string, origin)

  const init: RequestInit = {
    method: req.method,
    headers: createNodeHeaders(req.headers),
    // @ts-expect-error: Internal. Check https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1483
    duplex: 'half',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD')
    init.body = req as any

  return new Request(url.href, init)
}

export async function sendNodeResponse(
  res: ServerResponse,
  nodeResponse: Response,
): Promise<void> {
  for (const [key, value] of nodeResponse.headers.entries()) {
    if (key === 'set-cookie') {
      const cookies = splitCookiesString(nodeResponse.headers.get('set-cookie')!)
      res.setHeader('set-cookie', cookies)
    }
    else {
      res.setHeader(key, value)
    }
  }

  return send(res, nodeResponse.status, await nodeResponse.text())
}
