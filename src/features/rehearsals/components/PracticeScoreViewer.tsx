import {
  CompressOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Flex, Skeleton, Typography } from 'antd'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { SongMaterial } from '@/features/music-library'
import { ErrorState } from '@/shared/ui'
import { fileExtension } from '@/shared/utils/media'
import { colors, radius, spacing } from '@/styles/tokens'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const minScale = 0.75
const maxScale = 1.75
const scaleStep = 0.25

function ScoreSkeleton() {
  return (
    <output aria-busy="true" aria-label="Đang tải bản nhạc" className="practice-score-skeleton">
      <Skeleton active title={false} paragraph={{ rows: 10, width: ['100%', '96%', '100%', '92%', '100%'] }} />
    </output>
  )
}

export function PracticeScoreViewer({
  material,
  songTitle,
  refreshing,
  onRefresh,
}: Readonly<{
  material: SongMaterial
  songTitle: string
  refreshing: boolean
  onRefresh: () => Promise<void>
}>) {
  const container = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [loadError, setLoadError] = useState<Error>()
  const [retryKey, setRetryKey] = useState(0)
  const materialExtension = material.fileName ? fileExtension(material.fileName) : undefined
  const isPdf = materialExtension === '.pdf'
  const isImage = materialExtension === '.png' || materialExtension === '.jpg'
  const pageWidth = Math.max(1, containerWidth - spacing.lg * 2)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const updateWidth = () => setContainerWidth(element.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [collapsed])

  const retry = async () => {
    await onRefresh()
    setLoadError(undefined)
    setRetryKey((value) => value + 1)
  }

  const zoom = (direction: -1 | 1) => {
    setScale((value) => Math.min(maxScale, Math.max(minScale, value + direction * scaleStep)))
  }

  return (
    <section
      className="practice-score-viewer"
      aria-labelledby="practice-score-heading"
      style={{
        '--score-border': colors.border,
        '--score-muted-border': colors.mutedBorder,
        '--score-ivory': colors.ivory,
        '--score-surface': colors.surface,
        '--score-radius': `${radius.lg}px`,
        '--score-space-sm': `${spacing.sm}px`,
        '--score-space-md': `${spacing.md}px`,
        '--score-space-lg': `${spacing.lg}px`,
        '--score-space-xl': `${spacing.xl}px`,
      } as CSSProperties}
    >
      <Flex wrap justify="space-between" align="center" gap={spacing.sm}>
        <div>
          <Typography.Title id="practice-score-heading" level={3} style={{ margin: 0 }}>
            Bản nhạc
          </Typography.Title>
          <Typography.Text type="secondary">{material.title} · {material.fileName}</Typography.Text>
        </div>
        <Flex wrap gap={spacing.sm}>
          <Button icon={<DownloadOutlined />} href={material.url ?? undefined} target="_blank" rel="noreferrer">
            Mở/Tải xuống
          </Button>
          <Button
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            aria-expanded={!collapsed}
            aria-controls="practice-score-content"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? 'Mở bản nhạc' : 'Thu gọn'}
          </Button>
        </Flex>
      </Flex>

      {!collapsed && (
        <div id="practice-score-content" style={{ marginTop: spacing.md }}>
          {isPdf && (
            <>
              <Flex className="practice-score-toolbar" wrap justify="space-between" align="center" gap={spacing.sm}>
                <Flex align="center" gap={spacing.sm}>
                  <Button
                    icon={<LeftOutlined />}
                    aria-label="Trang bản nhạc trước"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  />
                  <Typography.Text aria-live="polite">
                    Trang {pageNumber} / {numPages || '…'}
                  </Typography.Text>
                  <Button
                    icon={<RightOutlined />}
                    aria-label="Trang bản nhạc sau"
                    disabled={!numPages || pageNumber >= numPages}
                    onClick={() => setPageNumber((value) => Math.min(numPages, value + 1))}
                  />
                </Flex>
                <Flex align="center" gap={spacing.sm}>
                  <Button icon={<ZoomOutOutlined />} aria-label="Thu nhỏ bản nhạc" disabled={scale <= minScale} onClick={() => zoom(-1)} />
                  <Typography.Text style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(scale * 100)}%</Typography.Text>
                  <Button icon={<ZoomInOutlined />} aria-label="Phóng to bản nhạc" disabled={scale >= maxScale} onClick={() => zoom(1)} />
                  <Button icon={<CompressOutlined />} onClick={() => setScale(1)}>Vừa chiều rộng</Button>
                </Flex>
              </Flex>

              <div ref={container} className="practice-score-document-stage">
                {containerWidth > 0 && (
                  <Document
                    key={`${material.url}-${retryKey}`}
                    file={material.url}
                    suspense={false}
                    loading={<ScoreSkeleton />}
                    error={(
                      <ErrorState
                        headingLevel={3}
                        title="Không thể mở bản nhạc"
                        description="Liên kết bản nhạc có thể đã hết hạn. Vui lòng tải lại rồi thử tiếp."
                        error={loadError}
                        onRetry={() => void retry()}
                        retrying={refreshing}
                      />
                    )}
                    onLoadError={setLoadError}
                    onLoadSuccess={({ numPages: total }) => {
                      setNumPages(total)
                      setPageNumber((value) => Math.min(value, total))
                    }}
                  >
                    <figure aria-label={`Trang ${pageNumber} của bản nhạc ${songTitle}`} style={{ margin: 0 }}>
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        scale={scale}
                        suspense={false}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<ScoreSkeleton />}
                      />
                    </figure>
                  </Document>
                )}
              </div>
            </>
          )}

          {isImage && !loadError && (
            <figure
              aria-label={`Bản nhạc ${songTitle}`}
              style={{ margin: 0, padding: spacing.md, background: colors.ivory, border: `1px solid ${colors.border}`, borderRadius: radius.lg }}
            >
              <img
                src={material.url ?? undefined}
                alt={`Bản nhạc ${material.title}`}
                onError={() => setLoadError(new Error('Score image failed to load'))}
                style={{ display: 'block', maxWidth: '100%', height: 'auto', marginInline: 'auto' }}
              />
            </figure>
          )}

          {isImage && loadError && (
            <ErrorState
              headingLevel={3}
              title="Không thể mở bản nhạc"
              description="Liên kết bản nhạc có thể đã hết hạn. Vui lòng tải lại rồi thử tiếp."
              error={loadError}
              onRetry={() => void retry()}
              retrying={refreshing}
            />
          )}

          {!isPdf && !isImage && (
            <ErrorState
              headingLevel={3}
              title="Không thể xem trước bản nhạc"
              description="Định dạng này chưa hỗ trợ xem trực tiếp. Vui lòng mở hoặc tải tài liệu xuống."
              extra={<Button href={material.url ?? undefined} target="_blank" rel="noreferrer">Mở/Tải xuống</Button>}
            />
          )}
        </div>
      )}
    </section>
  )
}
