import { describe, expect, it } from '@jest/globals'

import { SSEParser } from '../sse'

describe('SSEParser', () => {
  it('parses chunk events from complete lines', () => {
    const p = new SSEParser()
    const events = p.push('data: {"chunk": "Hello"}\n\ndata: {"chunk": " world"}\n\n')
    expect(events).toEqual([
      { type: 'chunk', value: 'Hello' },
      { type: 'chunk', value: ' world' },
    ])
  })

  it('buffers a partial line across pushes', () => {
    const p = new SSEParser()
    expect(p.push('data: {"chunk": "Hel')).toEqual([])
    expect(p.push('lo"}\n')).toEqual([{ type: 'chunk', value: 'Hello' }])
  })

  it('emits a done event on [DONE]', () => {
    const p = new SSEParser()
    expect(p.push('data: [DONE]\n')).toEqual([{ type: 'done' }])
  })

  it('emits an error event', () => {
    const p = new SSEParser()
    expect(p.push('data: {"error": "boom"}\n')).toEqual([{ type: 'error', value: 'boom' }])
  })

  it('skips malformed JSON and non-data lines', () => {
    const p = new SSEParser()
    expect(p.push(': keep-alive\n')).toEqual([])
    expect(p.push('data: {not json}\n')).toEqual([])
  })

  it('flushes a trailing buffered line', () => {
    const p = new SSEParser()
    p.push('data: {"chunk": "tail"}')
    expect(p.flush()).toEqual([{ type: 'chunk', value: 'tail' }])
    expect(p.flush()).toEqual([])
  })
})
