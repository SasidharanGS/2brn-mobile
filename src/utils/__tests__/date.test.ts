import { describe, expect, it } from '@jest/globals'

import { addDays, isFuture, isToday, parseISODate, prettyTime, relativeDay, toISODate, todayISODate } from '../date'

describe('date utils', () => {
  it('formats a Date as YYYY-MM-DD (local)', () => {
    expect(toISODate(new Date(2026, 5, 8))).toBe('2026-06-08')
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })

  it('parses and round-trips an ISO date', () => {
    expect(toISODate(parseISODate('2026-06-08'))).toBe('2026-06-08')
  })

  it('adds and subtracts days across month boundaries', () => {
    expect(addDays('2026-06-08', 1)).toBe('2026-06-09')
    expect(addDays('2026-06-01', -1)).toBe('2026-05-31')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('detects today / yesterday / future', () => {
    const today = todayISODate()
    expect(isToday(today)).toBe(true)
    expect(isFuture(addDays(today, 1))).toBe(true)
    expect(isFuture(today)).toBe(false)
    expect(relativeDay(today)).toBe('Today')
    expect(relativeDay(addDays(today, -1))).toBe('Yesterday')
  })

  it('formats a time and tolerates bad input', () => {
    expect(prettyTime('not-a-date')).toBe('')
    expect(typeof prettyTime('2026-06-08T14:47:00Z')).toBe('string')
  })
})
