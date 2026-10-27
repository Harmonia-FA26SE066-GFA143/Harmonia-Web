import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Checkbox, Flex, Form, InputNumber, Modal, Select, TreeSelect } from 'antd'
import { themeTreeData, useCatalogOptions, useLookup, useSkillOptions, type CatalogOption } from '@/features/system-categories'
import { spacing } from '@/styles/tokens'
import type { SkillRequirementValue, SongClassification, SongClassificationValues } from '../types'

export interface SongClassificationModalProps {
  open: boolean
  classification: SongClassification
  saving?: boolean
  onSubmit: (values: SongClassificationValues) => void
  onCancel: () => void
}

/**
 * Lookups list active entries only, but a song keeps values that were deactivated later (the backend allows it);
 * they are added here so the select shows their name and saving keeps them.
 */
function withCurrent(options: CatalogOption[], current: { value: string; label: string }[]): CatalogOption[] {
  return [...options, ...current.filter((item) => !options.some((option) => option.value === item.value))]
}

const refOptions = (refs: { id: string; name: string }[]) => refs.map((ref) => ({ value: ref.id, label: ref.name }))
const skillOptions = (items: { skillId: string; skillName: string }[]) =>
  items.map((item) => ({ value: item.skillId, label: item.skillName }))

type RequirementField = 'vocalRequirements' | 'instrumentRequirements'

const toRequirement = (row: SkillRequirementValue): SkillRequirementValue => ({
  ...row,
  isMandatory: Boolean(row.isMandatory),
  requiredCount: row.requiredCount ?? 1,
})

function RequirementList({ name, label, addLabel, options }: Readonly<{
  name: RequirementField
  label: string
  addLabel: string
  options: CatalogOption[]
}>) {
  const chosen: (string | undefined)[] = (Form.useWatch(name) ?? []).map((row?: { skillId?: string }) => row?.skillId)

  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Flex vertical gap={spacing.sm}>
            {fields.map((field, index) => (
              <Flex key={field.key} gap={spacing.sm} align="start">
                <Form.Item
                  name={[field.name, 'skillId']}
                  rules={[{ required: true, message: 'Vui lòng chọn kỹ năng.' }]}
                  style={{ flex: 1, margin: 0 }}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn kỹ năng"
                    aria-label={`${label} ${index + 1}`}
                    // One skill once per list: the backend rejects duplicates.
                    options={options.map((option) => ({
                      ...option,
                      disabled: option.value !== chosen[index] && chosen.includes(option.value),
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'requiredCount']}
                  rules={[{ required: true, message: 'Nhập số người.' }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber min={1} max={50} precision={0} addonAfter="người" aria-label={`Số người ${label.toLowerCase()} ${index + 1}`} style={{ width: 130 }} />
                </Form.Item>
                <Form.Item name={[field.name, 'isMandatory']} valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox style={{ paddingTop: 5 }}>Bắt buộc</Checkbox>
                </Form.Item>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label={`Gỡ ${label.toLowerCase()} ${index + 1}`}
                  onClick={() => remove(field.name)}
                />
              </Flex>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ isMandatory: false, requiredCount: 1 })} style={{ alignSelf: 'flex-start' }}>
              {addLabel}
            </Button>
          </Flex>
        )}
      </Form.List>
    </Form.Item>
  )
}

/** Edits every FE-29 dimension of a song at once (PUT /api/songs/{id}/classification replaces the whole set). */
export function SongClassificationModal({ open, classification, saving = false, onSubmit, onCancel }: Readonly<SongClassificationModalProps>) {
  const seasons = withCurrent(useCatalogOptions('seasons'), refOptions(classification.liturgicalSeasons))
  const massTypes = withCurrent(useCatalogOptions('massTypes'), refOptions(classification.massTypes))
  const ceremonyTypes = withCurrent(useCatalogOptions('ceremonyTypes'), refOptions(classification.ceremonyTypes))
  const slots = withCurrent(useCatalogOptions('liturgicalSlots'), refOptions(classification.liturgicalSlots))
  // A theme switched off later stays on the song; it is offered at the top so saving keeps it.
  const activeThemes = useLookup('songThemes').data ?? []
  const themes = themeTreeData([
    ...activeThemes,
    ...classification.songThemes.filter((theme) => !activeThemes.some((active) => active.id === theme.id)),
  ])
  const skills = useSkillOptions()
  const vocal = withCurrent(skills.vocal, skillOptions(classification.vocalRequirements))
  const instrument = withCurrent(skills.instrument, skillOptions(classification.instrumentRequirements))

  const multiSelects: { name: keyof SongClassificationValues; label: string; options: CatalogOption[] }[] = [
    { name: 'liturgicalSeasonIds', label: 'Mùa phụng vụ', options: seasons },
    { name: 'massTypeIds', label: 'Loại Thánh lễ', options: massTypes },
    { name: 'ceremonyTypeIds', label: 'Loại nghi thức', options: ceremonyTypes },
    { name: 'liturgicalSlotIds', label: 'Phần phụng vụ', options: slots },
  ]

  const requirementValues = (items: SongClassification['vocalRequirements']) =>
    items.map(({ skillId, isMandatory, requiredCount }) => ({ skillId, isMandatory, requiredCount }))

  return (
    <Modal
      open={open}
      title="Chỉnh sửa phân loại"
      okText="Lưu phân loại"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      width={720}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<SongClassificationValues>
          layout="vertical"
          initialValues={{
            liturgicalSeasonIds: classification.liturgicalSeasons.map((ref) => ref.id),
            massTypeIds: classification.massTypes.map((ref) => ref.id),
            ceremonyTypeIds: classification.ceremonyTypes.map((ref) => ref.id),
            songThemeIds: classification.songThemes.map((ref) => ref.id),
            liturgicalSlotIds: classification.liturgicalSlots.map((ref) => ref.id),
            vocalRequirements: requirementValues(classification.vocalRequirements),
            instrumentRequirements: requirementValues(classification.instrumentRequirements),
          }}
          onFinish={(values) =>
            onSubmit({
              liturgicalSeasonIds: values.liturgicalSeasonIds ?? [],
              massTypeIds: values.massTypeIds ?? [],
              ceremonyTypeIds: values.ceremonyTypeIds ?? [],
              songThemeIds: values.songThemeIds ?? [],
              liturgicalSlotIds: values.liturgicalSlotIds ?? [],
              vocalRequirements: (values.vocalRequirements ?? []).map(toRequirement),
              instrumentRequirements: (values.instrumentRequirements ?? []).map(toRequirement),
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', columnGap: spacing.md }}>
        {multiSelects.map((select) => (
          <Form.Item key={select.name} label={select.label} name={select.name}>
            <Select
              mode="multiple"
              allowClear
              optionFilterProp="label"
              placeholder={`Chọn ${select.label.toLowerCase()}`}
              options={select.options}
            />
          </Form.Item>
        ))}
        <Form.Item label="Chủ đề" name="songThemeIds" extra="Lọc theo một chủ đề cũng ra bài của các chủ đề con.">
          <TreeSelect multiple allowClear showSearch treeNodeFilterProp="title" treeDefaultExpandAll placeholder="Chọn chủ đề" treeData={themes} />
        </Form.Item>
      </div>
      <RequirementList name="vocalRequirements" label="Yêu cầu bè giọng" addLabel="Thêm bè giọng" options={vocal} />
      <RequirementList name="instrumentRequirements" label="Yêu cầu nhạc cụ" addLabel="Thêm nhạc cụ" options={instrument} />
    </Modal>
  )
}
