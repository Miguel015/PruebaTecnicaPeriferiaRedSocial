import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Posts from './Posts'
import { AuthContext } from '../context/AuthContext'

vi.mock('../api/client', () => {
  return {
    resolveAssetUrl: (s: string) => s,
    useApi: () => ({
      fetcher: async (path: string, opts: any = {}) => {
        if (path.startsWith('/posts?page')) {
          return { items: [{ id: 'p1', content: 'hi', totalLikes: 2, liked: false, authorUsername: 'carla', authorId: 'u2', imgs: [], createdAt: new Date().toISOString() }], total: 1 }
        }
        return null
      }
    })
  }
})

describe('Posts extra tests', () => {
  test('muestra el username del autor cuando viene en la respuesta', async () => {
    const ctx = { token: 't', user: { id: 'u2', username: 'carla' }, setToken: () => {} }
    render(
      <AuthContext.Provider value={ctx as any}>
        <Posts />
      </AuthContext.Provider>
    )
    await waitFor(() => expect(screen.getAllByText('carla').length).toBeGreaterThanOrEqual(1))
  })

  test('abre y cierra el modal de creación', async () => {
    // mock fetcher returning empty posts
    vi.mocked // ensure vi is referenced
    const ctx = { token: 't', user: { id: 'u1', username: 'alice' }, setToken: () => {} }
    const { getByLabelText, queryByText } = render(
      <AuthContext.Provider value={ctx as any}>
        <Posts />
      </AuthContext.Provider>
    )
    // open create modal (FAB has aria-label Crear post)
    const fab = getByLabelText('Crear post')
    fireEvent.click(fab)
    await waitFor(() => expect(queryByText('Crear publicación')).toBeInTheDocument())
    // click Cancelar
    const cancel = queryByText('Cancelar') as HTMLElement
    fireEvent.click(cancel)
    await waitFor(() => expect(queryByText('Crear publicación')).not.toBeInTheDocument())
  })
})
