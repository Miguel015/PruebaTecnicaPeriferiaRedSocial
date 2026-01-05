import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
import Posts from './Posts'
import { AuthContext } from '../context/AuthContext'

// mock useApi module
// mock API client and asset resolver
vi.mock('../api/client', () => {
  return {
    resolveAssetUrl: (s: string) => s,
    useApi: () => ({
      fetcher: async (path: string, opts: any = {}) => {
        if (path.startsWith('/posts?page')) {
          return { items: [{ id: 'p1', content: 'hello', totalLikes: 0, liked: false, authorUsername: 'alice', authorId: 'u1', imgs: [], createdAt: new Date().toISOString() }], total: 1 }
        }
        if (path.endsWith('/like') && opts.method === 'POST') {
          return { liked: true, totalLikes: 1 }
        }
        return null
      }
    })
  }
})

// stub scroll behavior for jsdom
let _scrollY = 0
Object.defineProperty(window, 'scrollY', {
  get: () => _scrollY,
})
window.scrollTo = (x: number, y: number) => {
  _scrollY = y || 0
}

describe('Posts component', () => {
  test('clicking like updates count and does not change scroll', async () => {
    // initial scroll
    window.scrollTo(0, 0)
    const ctx = { token: 't', user: { id: 'u1', username: 'alice' }, setToken: () => {} }
    render(
      <AuthContext.Provider value={ctx as any}>
        <Posts />
      </AuthContext.Provider>
    )
    // wait for post to appear
    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument())
    const postEl = screen.getByText('hello').closest('article') as HTMLElement
    const likeBtn = within(postEl).getByRole('button')
    // find the likes counter near the button
    const likeCount = within(postEl).getByText('0')
    expect(likeCount).toBeInTheDocument()
    // click like
    fireEvent.mouseDown(likeBtn)
    fireEvent.click(likeBtn)
    // wait for update
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    // ensure scroll position unchanged
    expect(window.scrollY).toBe(0)
  })
})
