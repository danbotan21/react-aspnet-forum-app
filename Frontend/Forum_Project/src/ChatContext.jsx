import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuth } from './AuthContext'
import { fetchChatUnreadCount } from './utils/chatApi'

const ChatContext = createContext(null)

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth()
  const [totalUnread, setTotalUnread] = useState(0)
  const listenersRef = useRef(new Set())
  const connectionRef = useRef(null)

  const refreshUnread = useCallback(async () => {
    if (!token) {
      setTotalUnread(0)
      return
    }
    try {
      const count = await fetchChatUnreadCount()
      setTotalUnread(count)
    } catch {
      /* ignore */
    }
  }, [token])

  useEffect(() => {
    refreshUnread()
  }, [refreshUnread])

  // Pages subscribe with a callback (eventName, payload).
  const subscribe = useCallback((callback) => {
    listenersRef.current.add(callback)
    return () => listenersRef.current.delete(callback)
  }, [])

  const notifyTyping = useCallback((otherUserId, conversationId) => {
    connectionRef.current
      ?.invoke('SendTyping', otherUserId, conversationId)
      .catch(() => {})
  }, [])

  // Dedicated SignalR connection for chat (separate from notifications, same hub).
  useEffect(() => {
    if (!token || !user) {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
      }
      return
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notifications', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    const dispatch = (eventName, payload) => {
      listenersRef.current.forEach((cb) => {
        try {
          cb(eventName, payload)
        } catch {
          /* ignore listener errors */
        }
      })
    }

    connection.on('ReceiveMessage', (m) => {
      dispatch('message', m)
      setTotalUnread((prev) => prev + 1)
    })
    connection.on('MessagesRead', (p) => dispatch('read', p))
    connection.on('MessageEdited', (m) => dispatch('edited', m))
    connection.on('MessageDeleted', (p) => dispatch('deleted', p))
    connection.on('ConversationDeleted', (p) => dispatch('convDeleted', p))
    connection.on('Typing', (p) => dispatch('typing', p))

    connection
      .start()
      .then(() => {
        connectionRef.current = connection
      })
      .catch(() => {
        /* withAutomaticReconnect handles retries */
      })

    return () => {
      connection.stop()
      connectionRef.current = null
    }
  }, [token, user])

  return (
    <ChatContext.Provider
      value={{ totalUnread, setTotalUnread, refreshUnread, subscribe, notifyTyping }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within a ChatProvider')
  return ctx
}
