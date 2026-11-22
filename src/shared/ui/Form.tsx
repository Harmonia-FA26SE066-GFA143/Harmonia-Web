import { Form as AntForm, type FormInstance, type FormProps } from 'antd'
import type { ReactNode } from 'react'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function collectChangedPaths(value: unknown, prefix: string[] = []): string[][] {
  if (Array.isArray(value)) {
    const keys = Object.keys(value)
    if (keys.length === 0) return prefix.length > 0 ? [prefix] : []
    return keys.flatMap((key) => collectChangedPaths(value[Number(key)], [...prefix, key]))
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return prefix.length > 0 ? [prefix] : []
    return entries.flatMap(([key, child]) => collectChangedPaths(child, [...prefix, key]))
  }
  return prefix.length > 0 ? [prefix] : []
}

function matchesChangedPath(fieldName: (string | number)[], changedPath: string[]): boolean {
  return (
    fieldName.length > 0 &&
    changedPath.length >= fieldName.length &&
    fieldName.every((segment, index) => String(segment) === changedPath[index])
  )
}

/**
 * Drops only the errors of edited fields:
 * - Sibling nested fields (`['group', 'a']` vs `['group', 'b']`) and Form.List rows keep their errors.
 * - Array-valued (`Select mode="multiple"`, `TimePicker.RangePicker`) and plain-object (`Select labelInValue`) Form.Items
 *   match as a prefix of their changed leaf paths so their errors clear immediately on edit.
 */
function clearEditedErrors(form: FormInstance, changed: object) {
  const editedPaths = collectChangedPaths(changed)
  if (editedPaths.length === 0) return
  const stale = form.getFieldsError().filter(
    ({ name, errors }) => errors.length > 0 && editedPaths.some((path) => matchesChangedPath(name, path)),
  )
  if (stale.length > 0) form.setFields(stale.map(({ name }) => ({ name, errors: [] })))
}

/**
 * Single Harmonia `Form` wrapper (R4.2, SYS-05, G1-01):
 * - Enforces `layout="vertical"` (prevents horizontal label clipping) and `colon={false}` (no stray `:`).
 * - Checks a field on blur (`validateTrigger="onBlur"`) and clears its error as soon as it is edited.
 * - `requiredMark` policy: keeps Ant Design's `*` marker (`true`, default) when a form mixes required & optional fields
 *   without `(không bắt buộc)` label suffixes; pass `requiredMark={false}` when every field is optional (filters,
 *   classification) or for single-intent auth forms.
 * - Zero direct `import { Form } from 'antd'` outside this module.
 */
export function Form<Values = unknown>({
  form,
  layout = 'vertical',
  colon = false,
  validateTrigger = 'onBlur',
  onValuesChange,
  children,
  ...props
}: FormProps<Values>) {
  const [instance] = AntForm.useForm<Values>(form)
  return (
    <AntForm
      {...(props as FormProps)}
      form={instance as FormInstance}
      layout={layout}
      colon={colon}
      validateTrigger={validateTrigger}
      onValuesChange={(changed, values) => {
        clearEditedErrors(instance as FormInstance, changed)
        onValuesChange?.(changed, values)
      }}
    >
      {/* Render-function children are not used in this app. */}
      {children as ReactNode}
    </AntForm>
  )
}

Form.Item = AntForm.Item
Form.List = AntForm.List
Form.ErrorList = AntForm.ErrorList
Form.Provider = AntForm.Provider
Form.useForm = AntForm.useForm
Form.useFormInstance = AntForm.useFormInstance
Form.useWatch = AntForm.useWatch
