import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
} from '@/services/authService.js'
import { AuthContext } from './authContext.js'

const ANONYMOUS = { status: 'anonymous', user: null }

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })

  useEffect(() => {
    const controller = new AbortController()

    getSession({ signal: controller.signal })
      .then((user) => {
        setState(user ? { status: 'authenticated', user } : ANONYMOUS)
      })
      .catch(() => {
        if (!controller.signal.aborted) setState(ANONYMOUS)
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email, password) => {
    const user = await loginRequest(email, password)
    setState({ status: 'authenticated', user })
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setState(ANONYMOUS)
    }
  }, [])

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
