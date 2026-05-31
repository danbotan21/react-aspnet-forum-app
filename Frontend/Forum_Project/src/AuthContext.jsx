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

  if (response.status === 401 && _tokenRef && _refreshFn) {
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
  const logoutRef = useRef(null)

  // On mount: attempt silent re-auth using the httpOnly refresh token cookie.
  // If the cookie is valid the backend returns a fresh access token.
  useEffect(() => {
    const applyAuth = (data) => {
      if (data?.token && data?.user) {
        setToken(data.token)
        setUser(data.user)
        tokenRef.current = data.token
        userRef.current = data.user
        _tokenRef = data.token
        _userRef = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        localStorage.removeItem('user')
      }
    }

    const silentRefresh = () => {
      fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then(applyAuth)
        .catch(() => {})
    }

    fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(applyAuth)
      .catch(() => {
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))

    // Proactively refresh every 10 minutes so the access token never expires mid-session
    const interval = setInterval(silentRefresh, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Called after a successful login response from the backend.
  // The backend sets the refresh token as an httpOnly cookie automatically.
  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue) // Access token lives in memory only
    setUser(userData)
    userRef.current = userData
    tokenRef.current = tokenValue
    _tokenRef = tokenValue
    _userRef = userData
    localStorage.setItem('user', JSON.stringify(userData)) // Non-sensitive display data
  }, [])

  const logout = useCallback(async () => {
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
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json()
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
      return null
    } catch {
      return null
    }
  }, [])

  _refreshFn = refreshToken
  _logoutFn = logout

  // Used after a token refresh to update the in-memory access token.
  // The refreshTokenValue parameter is kept for call-site compatibility but ignored
  // because the server manages the refresh token via httpOnly cookie.
  const updateAuthTokens = useCallback(
    (tokenValue, _refreshTokenValue = null, userData = user) => {
      setToken(tokenValue)
      if (userData) {
        setUser(userData)
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
        refreshToken,
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
