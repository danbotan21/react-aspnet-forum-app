import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuth } from './AuthContext'
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './utils/notificationApi'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const connectionRef = useRef(null)

  // Load initial data when the user logs in
  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const [notifs, count] = await Promise.all([
          fetchNotifications(token),
          fetchUnreadCount(token),
        ])
        if (!cancelled) {
          setNotifications(notifs)
          setUnreadCount(count)
        }
      } catch {
        // ignore — user will see empty list
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  // SignalR real-time connection
  useEffect(() => {
    if (!token || !user) {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
      }
      return
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    const start = async () => {
      try {
        await connection.start()
        connectionRef.current = connection
      } catch {
        // withAutomaticReconnect handles retries
      }
    }

    start()

    return () => {
      connection.stop()
      connectionRef.current = null
    }
  }, [token, user])

  const markAsRead = useCallback(
    async (id) => {
      if (!token) return
      try {
        await markNotificationAsRead(id, token)
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // ignore
      }
    },
    [token],
  )

  const markAllAsRead = useCallback(async () => {
    if (!token) return
    try {
      await markAllNotificationsAsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [token])

  const removeNotification = useCallback(
    async (id) => {
      if (!token) return
      try {
        await deleteNotification(id, token)
        setNotifications((prev) => {
          const n = prev.find((x) => x.id === id)
          if (n && !n.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1))
          }
          return prev.filter((x) => x.id !== id)
        })
      } catch {
        // ignore
      }
    },
    [token],
  )

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
