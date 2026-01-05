import React, { createContext, useState, useEffect } from 'react'

type AuthContextType = {
  token: string | null
  setToken: (t: string | null) => void
  user: any | null
  setUser: (u: any | null) => void
}

export const AuthContext = createContext<AuthContextType>({ token: null, setToken: () => {}, user: null, setUser: () => {} })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) setTokenState(t)
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [])

  const setToken = (t: string | null) => {
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
    setTokenState(t)
    if (!t) {
      setUser(null)
      localStorage.removeItem('user')
    }
  }

  const setCtxUser = (u: any | null) => {
    setUser(u)
    if (u) localStorage.setItem('user', JSON.stringify(u))
    else localStorage.removeItem('user')
  }
  

  return <AuthContext.Provider value={{ token, setToken, user, setUser: setCtxUser }}>{children}</AuthContext.Provider>
}
