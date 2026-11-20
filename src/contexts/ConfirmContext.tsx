import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import './Confirm.css'

// In-app replacement for window.confirm(). The browser's own dialog can be blocked
// (e.g. "prevent this page from creating additional dialogs" or embedded previews),
// in which case it silently returns false and buttons appear to do nothing.

interface ConfirmOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  message: string
  resolve: (ok: boolean) => void
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmFn>((message, options = {}) =>
    new Promise<boolean>(resolve => {
      setPending({ message, ...options, resolve })
    }), [])

  const close = useCallback((ok: boolean) => {
    setPending(current => {
      current?.resolve(ok)
      return null
    })
  }, [])

  // Focus the confirm button when opened; Escape cancels
  useEffect(() => {
    if (!pending) return
    confirmButton.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="confirm-overlay" onClick={() => close(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="confirm-title">{pending.title ?? 'Please confirm'}</h3>
            <p id="confirm-message">{pending.message}</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => close(false)}>
                {pending.cancelText ?? 'Cancel'}
              </button>
              <button
                type="button"
                ref={confirmButton}
                className={`confirm-ok ${pending.danger ? 'danger' : ''}`}
                onClick={() => close(true)}
              >
                {pending.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider')
  return context
}
