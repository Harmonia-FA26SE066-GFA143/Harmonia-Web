// The backend stores the celebration names of the Liturgical Calendar API, which has no Vietnamese locale
// (Harmonia-BE LiturgicalCalendarApiClient.cs, `locale=en`). celebrationNames.json holds the ones it returned for
// 2025–2031 (data, kept out of the code); a name not listed (a newly added saint) is shown in English.

import celebrationNames from './celebrationNames.json'

const days: Record<string, string> = {
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
}

const ordinals: Record<string, number> = { First: 1, Second: 2, Third: 3, Fourth: 4, Fifth: 5, Sixth: 6, Seventh: 7 }

const seasons: Record<string, string> = {
  Advent: 'Mùa Vọng',
  Lent: 'Mùa Chay',
  Easter: 'Phục Sinh',
  'Ordinary Time': 'Thường niên',
}

/** 1–34 as Roman numerals, as Vietnamese liturgical calendars number the weeks. */
const roman = (n: number) =>
  'X'.repeat(Math.floor(n / 10)) + ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][n % 10]

const names: Record<string, string> = celebrationNames

// Weekdays and Sundays follow a few patterns, e.g. "Tuesday of the 2nd Week of Advent", "25th Sunday of Ordinary Time".
const dayName = '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)'
const rules: [RegExp, (...parts: string[]) => string][] = [
  [new RegExp(`^${dayName} of the (\\d+)(?:st|nd|rd|th) Week of (Advent|Lent|Easter|Ordinary Time)$`), (day, week, season) => `${days[day]} tuần ${roman(+week)} ${seasons[season]}`],
  [/^(\d+)(?:st|nd|rd|th) Sunday of Ordinary Time$/, (week) => `Chúa nhật ${roman(+week)} Thường niên`],
  [/^(First|Second|Third|Fourth|Fifth|Sixth|Seventh) Sunday of (Advent|Lent|Easter)$/, (nth, season) => `Chúa nhật ${roman(ordinals[nth])} ${seasons[season]}`],
  [new RegExp(`^${dayName} - Christmas Weekday$`), (day) => `${days[day]} Mùa Giáng Sinh`],
  [new RegExp(`^${dayName} after Ash Wednesday$`), (day) => `${days[day]} sau Lễ Tro`],
  [new RegExp(`^${dayName} of Holy Week$`), (day) => `${days[day]} Tuần Thánh`],
  [new RegExp(`^${dayName} of the Octave of Easter$`), (day) => `${days[day]} trong Tuần Bát Nhật Phục Sinh`],
  [/^(\d+)(?:st|nd|rd|th) Day of the Octave of Christmas$/, (n) => `Ngày thứ ${n} trong Tuần Bát Nhật Giáng Sinh`],
]

/** The Vietnamese name of a celebration from the Liturgical Calendar API; an unknown name is returned unchanged. */
export function celebrationNameVi(name: string): string {
  if (names[name]) return names[name]
  for (const [pattern, translate] of rules) {
    const match = pattern.exec(name)
    if (match) return translate(...match.slice(1))
  }
  return name
}
