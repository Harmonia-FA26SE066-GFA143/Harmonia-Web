import { CaretRightFilled, PauseOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import { colors, radius, spacing } from '@/styles/tokens'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** Flat bars shown until the file is loaded, so the row keeps its height and reads as audio. */
function IdleBars() {
  return (
    <Flex aria-hidden align="center" gap={2} style={{ height: 40, overflow: 'hidden' }}>
      {Array.from({ length: 64 }, (_, index) => (
        <span
          key={index}
          style={{
            flex: '0 0 2px',
            height: 6 + Math.abs(Math.sin(index * 0.7)) * 18,
            borderRadius: 2,
            background: 'rgba(142, 59, 75, 0.2)',
          }}
        />
      ))}
    </Flex>
  )
}

/**
 * Audio player with a waveform (wavesurfer.js, loaded on first play). Nothing is downloaded until the user presses
 * play: a song can carry several 20 MB files. The URL is read once per material; the signed URL renews on refetch and
 * must not restart playback. If the file cannot be decoded, the browser's own player takes over.
 */
export function AudioWaveform({ url, title }: Readonly<{ url: string; title: string }>) {
  const container = useRef<HTMLDivElement>(null)
  const player = useRef<WaveSurfer | null>(null)
  const latestUrl = useRef(url)
  useEffect(() => {
    latestUrl.current = url
  }, [url])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => () => player.current?.destroy(), [])

  const start = async () => {
    setState('loading')
    try {
      const { default: WaveSurferLib } = await import('wavesurfer.js')
      if (!container.current) return
      const ws = WaveSurferLib.create({
        container: container.current,
        url: latestUrl.current,
        height: 40,
        waveColor: 'rgba(142, 59, 75, 0.28)',
        progressColor: colors.primary,
        cursorWidth: 0,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
      })
      player.current = ws
      ws.on('ready', (seconds) => {
        setDuration(seconds)
        setState('ready')
        void ws.play()
      })
      ws.on('error', () => setState('failed'))
      ws.on('play', () => setPlaying(true))
      ws.on('pause', () => setPlaying(false))
      ws.on('finish', () => setPlaying(false))
      ws.on('timeupdate', setTime)
    } catch {
      setState('failed')
    }
  }

  if (state === 'failed') {
    return <audio controls src={url} aria-label={`Nghe ${title}`} style={{ width: '100%', height: 40 }} />
  }

  const toggle = () => (player.current ? void player.current.playPause() : void start())

  return (
    <Flex
      align="center"
      gap={spacing.sm}
      style={{ width: '100%', padding: `${spacing.xs}px ${spacing.sm}px`, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.md }}
    >
      <Button
        type="primary"
        shape="circle"
        icon={playing ? <PauseOutlined /> : <CaretRightFilled />}
        loading={state === 'loading'}
        onClick={toggle}
        aria-label={`${playing ? 'Tạm dừng' : 'Phát'} ${title}`}
      />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {state === 'idle' && <IdleBars />}
        {/* wavesurfer draws here; clicking the wave seeks, the button covers keyboard use. */}
        <div ref={container} aria-hidden style={{ display: state === 'idle' ? 'none' : 'block', minHeight: 40 }} />
      </div>
      <Typography.Text style={{ color: colors.textMuted, fontVariantNumeric: 'tabular-nums', fontSize: 12.5, flexShrink: 0 }}>
        {state === 'ready' ? `${clock(time)} / ${clock(duration)}` : '–:–'}
      </Typography.Text>
    </Flex>
  )
}
