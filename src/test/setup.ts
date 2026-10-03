import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach } from 'vitest'

// Pages chain several queries (program → song list → roster…) behind lazy Ant Design chunks; with every test file
// running in parallel the default 1 s for findBy*/waitFor was too short and tests failed at random.
configure({ asyncUtilTimeout: 3000 })

// Vitest runs without globals, so Testing Library cannot register its automatic unmount between tests.
afterEach(() => {
  cleanup()
})

// Ant Design schedules state updates with uncancelled timers (Form error list: up to 10 ms via
// @rc-component/util useDelayState). If one fires after jsdom is torn down, React throws
// "window is not defined" and Vitest fails the run. Let them settle before the file's environment closes.
afterAll(() => new Promise<void>((resolve) => setTimeout(resolve, 50)))

// Ant Design responsive components (Grid, Layout.Sider breakpoint) need matchMedia, which jsdom lacks.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// Ant Design Table and Tabs observe element sizes; jsdom has no ResizeObserver and no layout to report.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
