import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa'
import './Styles/Toast.css'

const ToastContext = createContext(null)

// Safe to call anywhere: if a component somehow renders outside the provider we
// return no-op functions instead of throwing, so feedback never crashes the app.
const NOOP_API = {
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
}

export const useToast = () => useContext(ToastContext) ?? NOOP_API

let idSeq = 0

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message, type = 'info', duration = 3800) => {
      if (!message) return undefined
      const id = ++idSeq
      setToasts((list) => [...list, { id, message: String(message), type }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      show,
      success: (m, d) => show(m, 'success', d),
      error: (m, d) => show(m, 'error', d),
      info: (m, d) => show(m, 'info', d),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className='toast-viewport'
        role='region'
        aria-live='polite'
        aria-label='Notifications'
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] ?? FaInfoCircle
          return (
            <div key={t.id} className={`toast toast--${t.type}`} role='status'>
              <Icon className='toast__icon' />
              <span className='toast__msg'>{t.message}</span>
              <button
                type='button'
                className='toast__close'
                aria-label='Dismiss notification'
                onClick={() => dismiss(t.id)}
              >
                <FaTimes />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
