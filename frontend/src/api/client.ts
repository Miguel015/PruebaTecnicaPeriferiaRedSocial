import { AuthContext } from '../context/AuthContext'
import React from 'react'

export const useApi = () => {
  const { token, setToken } = React.useContext(AuthContext)

  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

  const fetcher = async (path: string, opts: RequestInit = {}) => {
    const headers: Record<string, string> = {}
    // if body is FormData, do not set Content-Type (browser will set boundary)
    if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(apiUrl + path, { ...opts, headers })
    if (res.status === 401) {
      // token expired / unauthorized — force logout
      setToken(null)
      throw new Error('Unauthorized')
    }
    if (!res.ok) throw new Error((await res.text()) || res.statusText)
    const text = await res.text()
    try {
      return text ? JSON.parse(text) : null
    } catch {
      return text
    }
  }

  return { fetcher }
}

// export API base and helper to resolve potentially-relative asset URLs returned by backend
export const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
export const resolveAssetUrl = (u?: string | null) => {
  if (!u) return null
  try {
    // absolute URL -> return as-is
    const isAbsolute = /^https?:\/\//i.test(u)
    if (isAbsolute) return u
    // relative path starting with / -> prefix with API base
    if (u.startsWith('/')) return apiUrl + u
    // otherwise return as-is
    return u
  } catch {
    return u
  }
}
