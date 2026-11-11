import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onSessionCleared } from '@/lib/auth/session'

export type TaskStatus = 'running' | 'succeeded' | 'failed'

/** What a finished task says, and where its result can be opened. */
export interface TaskOutcome {
  summary: string
  action?: { label: string; to: string }
}

export interface TaskSpec {
  type: string
  /** One running task per key, e.g. `extract-lyrics:<materialId>`; a second start with the same key is refused. */
  key: string
  title: string
  /** The page the task was started from. */
  sourcePath: string
  /** `isCurrent()` turns false once the session ends: keep nothing for the next account after that. */
  run: (isCurrent: () => boolean) => Promise<TaskOutcome>
  errorMessage: (error: Error) => string
}

export interface BackgroundTask {
  id: string
  type: string
  key: string
  title: string
  sourcePath: string
  status: TaskStatus
  startedAt: number
  result?: TaskOutcome
  error?: string
  /** False until the finish has been announced once. */
  notified: boolean
}

interface BackgroundTasksValue {
  tasks: BackgroundTask[]
  /** False when a task with the same key is still running. */
  start: (spec: TaskSpec) => boolean
  retry: (id: string) => void
  dismiss: (id: string) => void
  markNotified: (id: string) => void
}

const BackgroundTasksContext = createContext<BackgroundTasksValue | undefined>(undefined)

/**
 * Tasks of this tab that outlive the page that started them: they run here, above the router, so moving to another
 * page neither stops them nor loses their result. Nothing survives a reload: the backend keeps no job for them yet
 * (TBD: Backend API missing — persistent AI lyrics extraction job). Signing out drops them all.
 */
export function BackgroundTaskProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([])
  const specs = useRef(new Map<string, TaskSpec>())
  const runningKeys = useRef(new Set<string>())
  // Bumped when the session ends: a task that finishes after that belongs to the old account and is dropped.
  const generation = useRef(0)

  useEffect(
    () =>
      onSessionCleared(() => {
        generation.current += 1
        specs.current.clear()
        runningKeys.current.clear()
        setTasks([])
      }),
    [],
  )

  const execute = useCallback((id: string, spec: TaskSpec) => {
    const born = generation.current
    const isCurrent = () => generation.current === born
    runningKeys.current.add(spec.key)
    const settle = async () => {
      let patch: Partial<BackgroundTask>
      try {
        patch = { status: 'succeeded', result: await spec.run(isCurrent) }
      } catch (error) {
        // A message that cannot be worded still ends the task, so it never stays "running".
        let text = 'Tác vụ không thành công. Vui lòng thử lại.'
        try {
          text = spec.errorMessage(error instanceof Error ? error : new Error(String(error)))
        } catch {
          // Keep the generic text.
        }
        patch = { status: 'failed', error: text }
      }
      if (!isCurrent()) return
      runningKeys.current.delete(spec.key)
      setTasks((all) => all.map((task) => (task.id === id ? { ...task, ...patch, notified: false } : task)))
    }
    // settle never rejects: every outcome is caught above.
    void settle()
  }, [])

  const start = useCallback(
    (spec: TaskSpec) => {
      if (runningKeys.current.has(spec.key)) return false
      const id = crypto.randomUUID()
      specs.current.set(id, spec)
      const { type, key, title, sourcePath } = spec
      setTasks((all) => [{ id, type, key, title, sourcePath, status: 'running', startedAt: Date.now(), notified: false }, ...all])
      execute(id, spec)
      return true
    },
    [execute],
  )

  const retry = useCallback(
    (id: string) => {
      const spec = specs.current.get(id)
      if (!spec || runningKeys.current.has(spec.key)) return
      setTasks((all) =>
        all.map((task) => (task.id === id ? { ...task, status: 'running', error: undefined, result: undefined, startedAt: Date.now() } : task)),
      )
      execute(id, spec)
    },
    [execute],
  )

  const dismiss = useCallback((id: string) => {
    specs.current.delete(id)
    setTasks((all) => all.filter((task) => task.id !== id || task.status === 'running'))
  }, [])

  const markNotified = useCallback((id: string) => {
    setTasks((all) => all.map((task) => (task.id === id ? { ...task, notified: true } : task)))
  }, [])

  const value = useMemo(() => ({ tasks, start, retry, dismiss, markNotified }), [tasks, start, retry, dismiss, markNotified])
  return <BackgroundTasksContext value={value}>{children}</BackgroundTasksContext>
}

// The hook belongs with its provider.
// oxlint-disable-next-line react/only-export-components
export function useBackgroundTasks() {
  const value = use(BackgroundTasksContext)
  if (!value) throw new Error('useBackgroundTasks needs BackgroundTaskProvider')
  return value
}
