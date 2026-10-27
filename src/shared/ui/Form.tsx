import { Form as AntForm, type FormInstance, type FormProps } from 'antd'
import type { ReactNode } from 'react'

/** Drops the errors of the fields just edited: a correction is not told it is wrong until it leaves the field again. */
function clearEditedErrors(form: FormInstance, changed: object) {
  const edited = Object.keys(changed)
  const stale = form.getFieldsError().filter(({ name, errors }) => errors.length > 0 && edited.includes(String(name[0])))
  if (stale.length > 0) form.setFields(stale.map(({ name }) => ({ name, errors: [] })))
}

/**
 * Ant Design `Form` that checks a field when it is left (blur), not on every keystroke, and clears that field's error
 * as soon as it is edited; submitting still checks every field. antd has no app-wide setting for this, so forms import
 * `Form` from here; `Form.Item`, `Form.List` and the hooks are antd's own.
 */
export function Form<Values = unknown>({ form, validateTrigger = 'onBlur', onValuesChange, children, ...props }: FormProps<Values>) {
  const [instance] = AntForm.useForm<Values>(form)
  return (
    <AntForm
      {...(props as FormProps)}
      form={instance as FormInstance}
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
