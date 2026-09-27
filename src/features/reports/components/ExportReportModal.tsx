import { DatePicker, Form, Modal, Radio, Select, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import { colors } from '@/styles/tokens'
import { adminReportKinds, reportDefinitions } from '../reportDefinitions'
import type { AdminReportKind, ReportExportRequest } from '../types'
import type { FilterOption } from './ReportFilterBar'

export interface ExportReportModalProps {
  open: boolean
  initialKind: AdminReportKind
  seasons: FilterOption[]
  exporting?: boolean
  onSubmit: (request: ReportExportRequest) => void
  onCancel: () => void
}

interface ExportFormValues {
  kind: AdminReportKind
  scopeType: 'month' | 'season'
  month?: Dayjs
  seasonId?: string
}

/**
 * Export an Admin report by month or liturgical season (FE-53). By-event export needs a program list API and
 * file format/delivery are not defined yet (TBD), so neither is offered.
 */
export function ExportReportModal({
  open,
  initialKind,
  seasons,
  exporting = false,
  onSubmit,
  onCancel,
}: ExportReportModalProps) {
  return (
    <Modal
      open={open}
      title="Xuất báo cáo"
      okText="Xuất báo cáo"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: exporting }}
      cancelButtonProps={{ disabled: exporting }}
      onCancel={onCancel}
      mask={{ closable: !exporting }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<ExportFormValues>
          layout="vertical"
          disabled={exporting}
          initialValues={{ kind: initialKind, scopeType: 'month' }}
          onFinish={(values) =>
            onSubmit({
              kind: values.kind,
              scope:
                values.scopeType === 'month' && values.month
                  ? { type: 'month', month: values.month.format('YYYY-MM') }
                  : { type: 'season', seasonId: values.seasonId ?? '' },
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item label="Loại báo cáo" name="kind" rules={[{ required: true, message: 'Vui lòng chọn loại báo cáo.' }]}>
        <Select options={adminReportKinds.map((kind) => ({ value: kind, label: reportDefinitions[kind].label }))} />
      </Form.Item>
      <Form.Item label="Phạm vi" name="scopeType">
        <Radio.Group
          options={[
            { value: 'month', label: 'Theo tháng' },
            { value: 'season', label: 'Theo mùa phụng vụ' },
          ]}
        />
      </Form.Item>
      <Form.Item noStyle dependencies={['scopeType']}>
        {({ getFieldValue }) =>
          getFieldValue('scopeType') === 'season' ? (
            <Form.Item
              label="Mùa phụng vụ"
              name="seasonId"
              rules={[{ required: true, message: 'Vui lòng chọn mùa phụng vụ.' }]}
            >
              <Select placeholder="Chọn mùa phụng vụ" options={seasons} />
            </Form.Item>
          ) : (
            <Form.Item label="Tháng" name="month" rules={[{ required: true, message: 'Vui lòng chọn tháng.' }]}>
              <DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng" style={{ width: '100%' }} />
            </Form.Item>
          )
        }
      </Form.Item>
      <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
        Báo cáo xuất ra chỉ gồm số liệu thực tế đã ghi nhận.
      </Typography.Paragraph>
    </Modal>
  )
}
