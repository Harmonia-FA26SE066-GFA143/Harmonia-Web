import dayjs, { type Dayjs } from 'dayjs'

/**
 * `Form.Item` props for a backend `DateOnly`: the form keeps the `YYYY-MM-DD` string it sends, the DatePicker works
 * on a dayjs value. Clearing the picker leaves the field undefined.
 */
export const dateOnlyFieldProps = {
  getValueProps: (value?: string | null) => ({ value: value ? dayjs(value) : undefined }),
  normalize: (date?: Dayjs | null) => date?.format('YYYY-MM-DD'),
}
