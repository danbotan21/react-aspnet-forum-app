import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null) // In-memory only — never stored in localStorage
  const [loading, setLoading] = useState(true)

  // On mount: attempt silent re-auth using the httpOnly refresh token cookie.
  // If the cookie is valid the backend returns a fresh access token.
  useEffect(() => {
    fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // sends the httpOnly refreshToken cookie
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.token && data?.user) {
          setToken(data.token)
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        } else {
          localStorage.removeItem('user')
        }
      })
      .catch(() => {
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  // Called after a successful login response from the backend.
  // The backend sets the refresh token as an httpOnly cookie automatically.
  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue) // Access token lives in memory only
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData)) // Non-sensitive display data
  }, [])

  const logout = useCallback(async () => {
    setToken(null)
    setUser(null)
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
