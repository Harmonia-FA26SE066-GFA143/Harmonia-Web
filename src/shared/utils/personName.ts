/** "Giuse Nguyễn Văn An": the saint name (tên thánh, BE afbf4c3) goes before the full name when there is one. */
export const personName = (fullName: string, saintName?: string | null) => [saintName?.trim(), fullName].filter(Boolean).join(' ')

/** Rule shared by every form that edits a saint name: optional, ≤ 50 (Harmonia-BE *Validator, `SaintName.MaximumLength(50)`). */
export const saintNameRules = [{ max: 50, message: 'Tên thánh tối đa 50 ký tự.' }]
