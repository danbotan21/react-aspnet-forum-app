import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import './Styles/Confirm.css'

const ConfirmContext = createContext(null)

// Drop-in async replacement for window.confirm(): returns a Promise<boolean>.
// Falls back to the native confirm if used outside the provider.
export const useConfirm = () =>
  useContext(ConfirmContext) ??
  (async (opts) =>
    window.confirm(typeof opts === 'string' ? opts : (opts?.message ?? 'Are you sure?')))

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null) // { options, resolve }

  const confirm = useCallback((options) => {
    const normalized =
      typeof options === 'string' ? { message: options } : options || {}
    return new Promise((resolve) => setState({ options: normalized, resolve }))
  }, [])

  const settle = useCallback((result) => {
    setState((current) => {
      current?.resolve(result)
      return null
    })
  }, [])

  useEffect(() => {
    if (!state) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false)
      if (e.key === 'Enter') settle(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state, settle])

  const opts = state?.options ?? {}
  const {
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
  } = opts

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className='confirm-overlay'
          role='dialog'
          aria-modal='true'
          onClick={() => settle(false)}
        >
          <div className='confirm-modal' onClick={(e) => e.stopPropagation()}>
            <h2 className='confirm-title'>{title}</h2>
            {message && <p className='confirm-message'>{message}</p>}
            <div className='confirm-actions'>
              <button
                type='button'
                className='confirm-btn confirm-btn-cancel'
                onClick={() => settle(false)}
                autoFocus
              >
                {cancelText}
              </button>
              <button
                type='button'
                className={`confirm-btn ${danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
                onClick={() => settle(true)}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export default ConfirmProvider
