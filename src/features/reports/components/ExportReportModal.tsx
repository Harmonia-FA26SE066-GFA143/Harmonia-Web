import { DatePicker, Form, Modal, Radio, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { colors } from '@/styles/tokens'
import { adminReportKinds, reportDefinitions } from '../reportDefinitions'
import { reportFormatLabels, type AdminReportKind, type ReportExportRequest, type ReportFilters, type ReportFormat } from '../types'
import type { FilterOption } from './ReportFilterBar'

export interface ExportReportModalProps {
  open: boolean
  initialKind: AdminReportKind
  /** The page's filters: the export starts from the month or season already chosen there. */
  filters?: ReportFilters
  seasons: FilterOption[]
  exporting?: boolean
  onSubmit: (request: ReportExportRequest) => void
  onCancel: () => void
}

interface ExportFormValues {
  kind: AdminReportKind
  format: ReportFormat
  scopeType: 'month' | 'season'
  month?: Dayjs
  seasonId?: string
}

/**
 * Exports a report by month or liturgical season (FE-53) to a file (`GET /api/reports/export`): every matching row,
 * in the chosen format. The backend records each export.
 */
export function ExportReportModal({
  open,
  initialKind,
  filters = {},
  seasons,
  exporting = false,
  onSubmit,
  onCancel,
}: Readonly<ExportReportModalProps>) {
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
          initialValues={{
            kind: initialKind,
            format: 'xlsx',
            scopeType: filters.seasonId && !filters.month ? 'season' : 'month',
            month: filters.month ? dayjs(`${filters.month}-01`) : undefined,
            seasonId: filters.seasonId,
          }}
          onFinish={({ kind, format, scopeType, month, seasonId }) =>
            onSubmit({
              kind,
              format,
              filters: {
                ...(scopeType === 'month' ? { month: month?.format('YYYY-MM') } : { seasonId }),
                choirId: filters.choirId,
              },
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
      <Form.Item label="Định dạng" name="format">
        <Radio.Group
          options={(Object.keys(reportFormatLabels) as ReportFormat[]).map((format) => ({
            value: format,
            label: reportFormatLabels[format],
          }))}
        />
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
            <Form.Item label="Mùa phụng vụ" name="seasonId" rules={[{ required: true, message: 'Vui lòng chọn mùa phụng vụ.' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Chọn mùa phụng vụ" options={seasons} />
            </Form.Item>
          ) : (
            <Form.Item label="Tháng" name="month" rules={[{ required: true, message: 'Vui lòng chọn tháng.' }]}>
              <DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng" style={{ width: '100%' }} />
            </Form.Item>
          )
        }
      </Form.Item>
      <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
        File gồm mọi dòng của báo cáo trong phạm vi đã chọn và được lưu vào lịch sử xuất.
        {filters.choirId && ' Điểm danh, xác nhận tham gia và bài tập chỉ gồm ca viên của ca đoàn đang lọc trên trang.'}
      </Typography.Paragraph>
    </Modal>
  )
}
