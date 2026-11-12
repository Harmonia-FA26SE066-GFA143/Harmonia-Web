import { Typography } from 'antd'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import antiphonalLeaf from '@/assets/images/landing/nga-antiphonal-leaf-4.jpg'
import { StatusTag } from '@/shared/ui'
import { seasonColors } from '@/styles/tokens'

const chapters = [
  { numeral: 'I', title: 'Chương trình hình thành', who: 'Ca trưởng', text: 'Ca trưởng chọn bài cho từng phần của Thánh lễ, ngay trên lịch phụng vụ của giáo xứ.' },
  { numeral: 'II', title: 'Cha xứ duyệt', who: 'Cha xứ', text: 'Cha xứ duyệt danh sách, yêu cầu sửa hoặc từ chối kèm ghi chú. Ca trưởng đọc được ngay lý do.' },
  {
    numeral: 'III',
    title: 'Ca đoàn tập và phân công',
    who: 'Cả ca đoàn',
    text: 'Ca viên trả lời trên điện thoại: có, không hay chưa chắc. Ca trưởng phân công đủ người cho từng bè, từng nhạc cụ, điểm danh buổi tập và nhận xét bản thu.',
  },
  { numeral: 'IV', title: 'Sẵn sàng cử hành', who: 'Giáo xứ', text: 'Đến ngày lễ, mỗi phần việc đã có người lo, và ca đoàn phục vụ Thánh lễ.' },
]

/** Illustration only (labelled on the sheet); the public page has no data. */
const songs = [
  { part: 'Ca nhập lễ', title: 'Đêm thánh vô cùng' },
  { part: 'Đáp ca', title: 'Thánh vịnh 95' },
  { part: 'Dâng lễ', title: 'Lễ vật tâm tình' },
  { part: 'Hiệp lễ', title: 'Emmanuel' },
  { part: 'Kết lễ', title: 'Hát mừng Giáng Sinh' },
]

const preparation = ['Đủ phân công', 'Đã tập', 'Đã luyện bài']

const step = (k: number) => ({ '--k': k }) as CSSProperties

/**
 * How one Mass gets its music ready, told in chapters beside a programme sheet that fills in as the reader scrolls.
 * Native scroll only; what has arrived stays when the reader goes back. Preparation is shown as separate chips, never
 * as a sequence.
 */
export function LandingStory() {
  const chapterRefs = useRef<(HTMLElement | null)[]>([])
  const noObserver = typeof IntersectionObserver === 'undefined'
  const [active, setActive] = useState(0)
  const [reached, setReached] = useState(noObserver ? chapters.length - 1 : 0)

  useEffect(() => {
    if (noObserver) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = chapterRefs.current.indexOf(entry.target as HTMLElement)
          setActive(index)
          setReached((value) => Math.max(value, index))
        }
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )
    for (const chapter of chapterRefs.current) if (chapter) observer.observe(chapter)
    return () => observer.disconnect()
  }, [noObserver])

  const shown = (from: number) => (reached >= from ? ' is-in' : '')

  return (
    <section aria-labelledby="steps-heading" className="landing-story">
      <div>
        <Typography.Title id="steps-heading" level={2} className="landing-story__heading">
          Từ danh sách bài hát đến ngày cử hành
        </Typography.Title>
        <Typography.Paragraph className="landing-story__lead">
          Mỗi Chúa Nhật trên lịch là một chương trình. Mỗi phần việc có người lo, và ai cũng thấy phần nào còn thiếu.
        </Typography.Paragraph>
        <ol className="landing-story__chapters">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.title}
              ref={(element) => {
                chapterRefs.current[index] = element
              }}
              className={`landing-chapter${index === active ? ' is-active' : ''}`}
            >
              <span aria-hidden className="landing-chapter__numeral">
                {chapter.numeral}
              </span>
              <div>
                <h3 className="landing-chapter__title">{chapter.title}</h3>
                <p className="landing-chapter__who">{chapter.who}</p>
                <p className="landing-chapter__text">{chapter.text}</p>
                {index === 0 && (
                  <figure className="landing-leaf">
                    <img src={antiphonalLeaf} alt="Trang sách thánh ca cổ: khuông bốn dòng kẻ đỏ, nốt vuông màu đen và chữ đầu tô đỏ, xanh" loading="lazy" />
                    <figcaption>Trang sách thánh ca, Ý, khoảng năm 1275. National Gallery of Art, Washington</figcaption>
                  </figure>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <aside aria-label="Tờ chương trình minh hoạ" className="landing-sheet">
        <span aria-hidden className={`landing-sheet__ribbon${shown(3)}`} style={{ background: seasonColors.purple.cloth }} />
        <div className="landing-sheet__head">
          <div>
            <p className="landing-sheet__title">Lễ Đêm Giáng Sinh</p>
            <p className="landing-sheet__hour">Lễ tối 19:00</p>
          </div>
          <span key={reached >= 1 ? 'approved' : 'draft'} className="hm-pop">
            {reached >= 1 ? <StatusTag color="green">Đã duyệt</StatusTag> : <StatusTag mark="draft">Bản nháp</StatusTag>}
          </span>
        </div>
        <ul className="landing-sheet__songs">
          {songs.map((song, index) => (
            <li key={song.part} className="landing-sheet__in is-in" style={step(index)}>
              <span className="landing-sheet__part">{song.part}</span>
              <span aria-hidden className="landing-sheet__leader" />
              <span className="landing-sheet__song">{song.title}</span>
            </li>
          ))}
        </ul>
        <p className={`landing-sheet__note landing-sheet__in${shown(1)}`}>Cha xứ: “Bài Hiệp lễ rất hợp với đêm nay.”</p>
        <div className="landing-sheet__chips">
          {preparation.map((label, index) => (
            <span key={label} className={`landing-sheet__in${shown(2)}`} style={step(index)}>
              <StatusTag color="green" style={{ marginInlineEnd: 0 }}>
                {label}
              </StatusTag>
            </span>
          ))}
        </div>
        <p className={`landing-sheet__ready landing-sheet__in${shown(3)}`}>Sẵn sàng cử hành</p>
        <p className="landing-sheet__label">Minh hoạ, không phải dữ liệu thật</p>
      </aside>
    </section>
  )
}
