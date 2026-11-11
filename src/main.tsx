import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts: only the weights in use; each CSS file splits latin/latin-ext/vietnamese by unicode-range.
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
// Season and celebration titles only (typography.displayFontFamily).
import '@fontsource/cormorant-garamond/600.css'
import '@/styles/global.css'
import { cssVariables } from '@/styles/tokens'
import { App } from '@/app/App'

// Every `--hm-*` variable from the semantic tokens, once, before the first paint: global.css reads them.
const tokenStyle = document.createElement('style')
tokenStyle.id = 'hm-tokens'
tokenStyle.textContent = cssVariables
document.head.prepend(tokenStyle)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
