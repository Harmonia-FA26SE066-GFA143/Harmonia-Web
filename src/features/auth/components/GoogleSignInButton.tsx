import { useEffect, useRef } from 'react'

/** The part of Google Identity Services (https://developers.google.com/identity/gsi/web) used here. */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

const scriptUrl = 'https://accounts.google.com/gsi/client'
let loading: Promise<GoogleIdentity> | undefined

/** Loads the Google Identity Services script once per page; a failed load can be tried again. */
function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google)
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google Identity Services missing')))
    script.onerror = () => {
      loading = undefined
      script.remove()
      reject(new Error('Google Identity Services did not load'))
    }
    document.head.append(script)
  })
  return loading
}

export interface GoogleSignInButtonProps {
  /** OAuth client id (type Web); the backend must accept tokens issued for it (`Google__ClientIds`). */
  clientId: string
  /** Receives the ID token Google returned for the chosen account. */
  onCredential: (idToken: string) => void
  /** Prevents a second Google sign-in while either sign-in flow is already being processed. */
  disabled?: boolean
  width?: number
}

/**
 * Google's own "Sign in with Google" button. Nothing is shown while the script loads or when it cannot load; the
 * email and password form stays usable either way.
 */
export function GoogleSignInButton({ clientId, onCredential, disabled = false, width = 400 }: Readonly<GoogleSignInButtonProps>) {
  const container = useRef<HTMLDivElement>(null)
  // The latest handler, so the button is not rendered again when the parent re-renders.
  const handler = useRef(onCredential)
  useEffect(() => {
    handler.current = onCredential
  })

  useEffect(() => {
    let active = true
    loadGoogleIdentity()
      .then((google) => {
        if (!active || !container.current) return
        const availableWidth = Math.floor(container.current.getBoundingClientRect().width)
        const buttonWidth = availableWidth > 0 ? Math.min(width, availableWidth) : width
        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => credential && handler.current(credential),
        })
        google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'vi',
          width: buttonWidth,
        })
      })
      .catch(() => {
        // Blocked or offline: the button stays hidden.
      })
    return () => {
      active = false
    }
  }, [clientId, width])

  return (
    <div
      ref={container}
      aria-busy={disabled}
      aria-disabled={disabled}
      inert={disabled}
      style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44, opacity: disabled ? 0.6 : 1 }}
    />
  )
}
