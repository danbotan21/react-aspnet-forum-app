import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const AuthContext = createContext(null)

let _tokenRef = null
let _userRef = null
let _refreshFn = null
let _logoutFn = null

export const apiFetch = async (url, options = {}) => {
  const headers = new Headers(options.headers || {})

  if (_tokenRef) {
    headers.set('Authorization', `Bearer ${_tokenRef}`)
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'include',
  })

  if (response.status === 401 && _refreshFn) {
    const newToken = await _refreshFn()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? 'include',
      })
    } else if (_logoutFn) {
      _logoutFn()
    }
  }

  return response
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null) // In-memory only — never stored in localStorage
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)
  const tokenRef = useRef(null)

  // Guards the refresh flow:
  //  - refreshPromiseRef: a single in-flight refresh so concurrent callers share ONE
  //    network call. The backend rotates the refresh token on every call, so firing
  //    several refreshes at once made all-but-one send a stale token → spurious logout.
  //  - loggedOutRef: once the user logs out, a late-completing refresh must not
  //    resurrect the session.
  const refreshPromiseRef = useRef(null)
  const loggedOutRef = useRef(false)

  const applyAuth = useCallback((data) => {
    if (loggedOutRef.current) return null
    if (data?.token && data?.user) {
      setToken(data.token)
      setUser(data.user)
      tokenRef.current = data.token
      userRef.current = data.user
      _tokenRef = data.token
      _userRef = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      return data.token
    }
    localStorage.removeItem('user')
    return null
  }, [])

  // Single serialized refresh. Returns the new access token, or null.
  const doRefresh = useCallback(async () => {
    if (loggedOutRef.current) return null
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const promise = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) return null
        const data = await res.json()
        return applyAuth(data)
      } catch {
        return null
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    refreshPromiseRef.current = promise
    return promise
  }, [applyAuth])

  // On mount: attempt silent re-auth using the httpOnly refresh token cookie.
  useEffect(() => {
    doRefresh().finally(() => setLoading(false))

    // Proactively refresh before the 15-min access token expires.
    const interval = setInterval(() => {
      doRefresh()
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [doRefresh])

  // Called after a successful login response from the backend.
  const login = useCallback((tokenValue, userData) => {
    loggedOutRef.current = false
    setToken(tokenValue) // Access token lives in memory only
    setUser(userData)
    userRef.current = userData
    tokenRef.current = tokenValue
    _tokenRef = tokenValue
    _userRef = userData
    localStorage.setItem('user', JSON.stringify(userData)) // Non-sensitive display data
  }, [])

  const logout = useCallback(async () => {
    loggedOutRef.current = true
    setToken(null)
    setUser(null)
    userRef.current = null
    tokenRef.current = null
    _tokenRef = null
    _userRef = null
    localStorage.removeItem('user')
    try {
      // Ask the backend to clear the httpOnly refresh token cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore network errors on logout
    }
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(userData)
    userRef.current = userData
    _userRef = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  _refreshFn = doRefresh
  _logoutFn = logout

  // Kept for call-site compatibility; the server manages the refresh token via cookie.
  const updateAuthTokens = useCallback(
    (tokenValue, _refreshTokenValue = null, userData = user) => {
      setToken(tokenValue)
      tokenRef.current = tokenValue
      _tokenRef = tokenValue
      if (userData) {
        setUser(userData)
        userRef.current = userData
        _userRef = userData
        localStorage.setItem('user', JSON.stringify(userData))
      }
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        updateAuthTokens,
        refreshToken: doRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
