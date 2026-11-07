import { useEffect, useMemo, useRef, useState } from 'react'

type TimeListener = (time: number) => void
export type PlaybackClockError = 'playback-failed'

export interface PlaybackClock {
  playing: boolean
  duration: number
  error: PlaybackClockError | null
  play(): Promise<void>
  pause(): void
  /** Clamped to [0, duration]; subscribers are called once right away, even while paused. */
  seek(seconds: number): void
  /** The one clock: `audio.currentTime`. */
  getTime(): number
  subscribe(listener: TimeListener): () => void
}

const PLAYBACK_ERROR: PlaybackClockError = 'playback-failed'
const AUDIO_EVENTS = ['play', 'pause', 'seeked', 'ended', 'loadedmetadata', 'durationchange', 'error'] as const

// A throwing subscriber must not stop the others or the frame loop.
function emit(listeners: Set<TimeListener>, time: number) {
  for (const listener of [...listeners]) {
    if (!listeners.has(listener)) continue // unsubscribed by an earlier listener in this same frame
    try {
      listener(time)
    } catch (e) {
      console.error('usePlaybackClock subscriber failed', e)
    }
  }
}

/**
 * Owns one HTMLAudioElement per `src`. Time is never accumulated: every value handed out is `audio.currentTime`.
 * React state is only `playing`, `duration`, `error`; time flows through `subscribe`/`getTime` so no frame re-renders.
 */
export function usePlaybackClock(src: string | undefined, fallbackDuration = 0): PlaybackClock {
  const safeFallbackDuration = Number.isFinite(fallbackDuration) && fallbackDuration > 0 ? fallbackDuration : 0
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<PlaybackClockError | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const listenersRef = useRef(new Set<TimeListener>())

  // New src = new audio: reset state during render (React's "adjust state on prop change"), not in the effect.
  const [prevSrc, setPrevSrc] = useState(src)
  if (prevSrc !== src) {
    setPrevSrc(src)
    setPlaying(false)
    setDuration(0)
    setError(null)
  }

  useEffect(() => {
    if (!src) return

    // Created here, not in render: StrictMode runs this effect twice and the first audio is disposed by the cleanup.
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = src
    audioRef.current = audio
    const listeners = listenersRef.current
    let frame: number | null = null

    const stopLoop = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
    }
    const tick = () => {
      frame = requestAnimationFrame(tick)
      emit(listeners, audio.currentTime)
    }
    const startLoop = () => {
      stopLoop()
      frame = requestAnimationFrame(tick)
    }
    const syncDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)

    const handlers: Record<(typeof AUDIO_EVENTS)[number], () => void> = {
      play: () => {
        setError(null) // a retry that actually plays clears the earlier autoplay error
        setPlaying(true)
        startLoop()
      },
      pause: () => {
        setPlaying(false)
        stopLoop()
      },
      ended: () => {
        setPlaying(false)
        stopLoop()
      },
      seeked: () => emit(listeners, audio.currentTime),
      loadedmetadata: syncDuration,
      durationchange: syncDuration,
      error: () => setError(PLAYBACK_ERROR),
    }
    for (const type of AUDIO_EVENTS) audio.addEventListener(type, handlers[type])

    // Hidden tabs get no useful frames: stop the loop, and on return resync subscribers and restart it (one frame).
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop()
        return
      }
      emit(listeners, audio.currentTime)
      if (!audio.paused) startLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    emit(listeners, 0)

    return () => {
      // Listeners go first so pause() below cannot set state on a disposed hook.
      for (const type of AUDIO_EVENTS) audio.removeEventListener(type, handlers[type])
      document.removeEventListener('visibilitychange', onVisibility)
      stopLoop()
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (audioRef.current === audio) audioRef.current = null
    }
  }, [src])

  const api = useMemo(
    () => ({
      async play() {
        const audio = audioRef.current
        if (!audio) return
        try {
          if (audio.ended) {
            audio.currentTime = 0
            emit(listenersRef.current, 0)
          }
          await audio.play()
        } catch {
          // A rejection from an audio that was already replaced or disposed (AbortError) is not the user's problem.
          if (audioRef.current !== audio) return
          setPlaying(false)
          setError(PLAYBACK_ERROR)
        }
      },
      pause() {
        audioRef.current?.pause()
      },
      seek(seconds: number) {
        const audio = audioRef.current
        if (!audio) return
        const max = Math.max(Number.isFinite(audio.duration) ? audio.duration : 0, safeFallbackDuration)
        audio.currentTime = Math.min(Math.max(seconds, 0), max)
        emit(listenersRef.current, audio.currentTime)
      },
      getTime: () => audioRef.current?.currentTime ?? 0,
      subscribe(listener: TimeListener) {
        const listeners = listenersRef.current
        listeners.add(listener)
        return () => void listeners.delete(listener)
      },
    }),
    [safeFallbackDuration],
  )

  const effectiveDuration = Math.max(duration, safeFallbackDuration)
  return useMemo(
    () => ({ playing, duration: effectiveDuration, error, ...api }),
    [playing, effectiveDuration, error, api],
  )
}
