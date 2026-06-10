import { describe, expect, it } from '@jest/globals'

import { isHttpUrl } from '../url'

describe('isHttpUrl', () => {
  it('accepts absolute http and https URLs', () => {
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('https://example.com/path?q=1#frag')).toBe(true)
    expect(isHttpUrl('HTTPS://EXAMPLE.COM')).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isHttpUrl('  https://example.com  ')).toBe(true)
  })

  it('rejects non-http(s) schemes', () => {
    expect(isHttpUrl('tel:+15551234567')).toBe(false)
    expect(isHttpUrl('sms:+15551234567')).toBe(false)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,<script>1</script>')).toBe(false)
    expect(isHttpUrl('twobrn://pair?u=x&t=y')).toBe(false)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
  })

  it('rejects relative paths and bare hosts', () => {
    expect(isHttpUrl('example.com')).toBe(false)
    expect(isHttpUrl('/relative/path')).toBe(false)
    expect(isHttpUrl('http://')).toBe(false)
  })

  it('rejects empty / null / undefined', () => {
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl('   ')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(undefined)).toBe(false)
  })
})
