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
    // handle unauthorized centrally
    if (res.status === 401) {
      setToken(null)
      throw new Error('Unauthorized')
    }

    const raw = await res.text()
    // try to parse JSON body when present
    let parsed: any = null
    try { parsed = raw ? JSON.parse(raw) : null } catch { parsed = null }

    if (!res.ok) {
      // prefer common NestJS error shapes
      let msg: string = res.statusText || 'Error'
      if (parsed) {
        if (typeof parsed === 'string') msg = parsed
        else if (parsed.message) {
          if (Array.isArray(parsed.message)) msg = parsed.message.join('; ')
          else msg = String(parsed.message)
        } else if (parsed.error) msg = String(parsed.error)
        else msg = JSON.stringify(parsed)
      } else if (raw) {
        msg = raw
      }
      throw new Error(msg)
    }

    // successful response: return parsed JSON or raw text
    if (parsed !== null) return parsed
    return raw || null
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
