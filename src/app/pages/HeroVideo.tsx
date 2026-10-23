import { CaretRightFilled, PauseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { media, sizes, spacing } from '@/styles/tokens'

const videoSrc = '/media/church-light-loop.mp4'
const posterSrc = '/media/church-light-poster.webp'

/** Video is skipped for users who ask for less motion or less data (Save-Data); they see the still poster. */
function motionAllowed() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false
  return !reduced && !saveData
}

const cover = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  // The left of the clip holds an icon stand; the light falls right of centre.
  objectPosition: '70% center',
} as const

/**
 * Decorative background of the landing hero: a silent looping clip over its still poster. The poster stays underneath,
 * so a failed or slow video still shows a picture. Read once on mount: changing the motion setting applies on reload.
 */
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null)
  const [enabled] = useState(motionAllowed)
  const [failed, setFailed] = useState(false)
  // Set by the video's own play/pause events, so a blocked autoplay (energy saver) shows "Phát".
  const [playing, setPlaying] = useState(false)

  // A fast failure (404, unsupported file) can fire `error` before React listens; catch it on mount too.
  useEffect(() => {
    if (video.current?.error) setFailed(true)
  }, [])

  const toggle = () => {
    const element = video.current
    if (!element) return
    if (element.paused) void element.play()?.catch(() => setPlaying(false))
    else element.pause()
  }

  return (
    <>
      <img src={posterSrc} alt="" aria-hidden style={cover} />
      {enabled && !failed && (
        <>
          <video
            ref={video}
            src={videoSrc}
            poster={posterSrc}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
            onError={() => setFailed(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            style={cover}
          />
          <Button
            shape="circle"
            icon={playing ? <PauseOutlined /> : <CaretRightFilled />}
            aria-label={playing ? 'Tạm dừng video nền' : 'Phát video nền'}
            onClick={toggle}
            style={{
              position: 'absolute',
              insetInlineEnd: spacing.md,
              insetBlockEnd: spacing.md,
              zIndex: 2,
              width: sizes.touchTarget,
              height: sizes.touchTarget,
              color: media.text,
              background: media.controlFill,
              borderColor: media.controlBorder,
              backdropFilter: 'blur(4px)',
            }}
          />
        </>
      )}
    </>
  )
}
