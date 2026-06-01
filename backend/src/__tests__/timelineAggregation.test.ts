import { describe, expect, it } from 'vitest';
import { aggregateTimeline, periodKeyForDate } from '../utils/timelineAggregation';

describe('periodKeyForDate', () => {
  it('formats day keys in UTC', () => {
    const date = new Date('2024-06-15T12:00:00.000Z');
    expect(periodKeyForDate(date, 'day')).toBe('2024-06-15');
  });

  it('formats month keys in UTC', () => {
    const date = new Date('2024-06-15T12:00:00.000Z');
    expect(periodKeyForDate(date, 'month')).toBe('2024-06');
  });
});

describe('aggregateTimeline', () => {
  const commits = [
    {
      hash: 'a',
      author: 'A',
      message: 'one',
      commitDate: new Date('2024-06-15T10:00:00.000Z'),
    },
    {
      hash: 'b',
      author: 'B',
      message: 'two',
      commitDate: new Date('2024-06-15T14:00:00.000Z'),
    },
    {
      hash: 'c',
      author: 'C',
      message: 'three',
      commitDate: new Date('2024-06-14T10:00:00.000Z'),
    },
  ];

  it('groups commits by day', () => {
    const periods = aggregateTimeline(commits, 'day');
    expect(periods).toHaveLength(2);
    expect(periods[0].period).toBe('2024-06-15');
    expect(periods[0].commitCount).toBe(2);
    expect(periods[1].period).toBe('2024-06-14');
    expect(periods[1].commitCount).toBe(1);
  });

  it('sorts commits within a period newest first', () => {
    const periods = aggregateTimeline(commits, 'day');
    const june15 = periods.find((p) => p.period === '2024-06-15');
    expect(june15?.commits[0].hash).toBe('b');
    expect(june15?.commits[1].hash).toBe('a');
  });
});
