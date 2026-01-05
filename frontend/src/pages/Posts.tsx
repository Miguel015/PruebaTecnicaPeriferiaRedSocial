import React, { useEffect, useState, useContext } from 'react'
import { useApi, resolveAssetUrl } from '../api/client'
import { AuthContext } from '../context/AuthContext'

const Posts: React.FC = () => {
  const { fetcher } = useApi()
  const { token, user } = useContext(AuthContext)
  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [likingId, setLikingId] = useState<string | null>(null)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>([])
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const [loadingMore, setLoadingMore] = useState(false)

  const [page, setPage] = useState(0)
  const pageSize = 5

  const load = async (p = 0, replace = true) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetcher(`/posts?page=${p}&size=${pageSize}`)
      const list = ((data && data.items) || []).map((p: any) => {
        // try to load images stored locally for this post id (array) or legacy single image
        const imgsJson = localStorage.getItem(`postImages:${p.id}`)
        let imgs: string[] | null = null
        if (imgsJson) {
          try {
            // ensure the local images belong to the same author if postAuthor is present
            const authorKey = localStorage.getItem(`postAuthor:${p.id}`)
            if (!authorKey || authorKey === (p.authorId ?? '')) {
              imgs = JSON.parse(imgsJson)
            }
          } catch { imgs = null }
        }
        // if no local previews, try images returned by backend (resolve relative paths)
        if (!imgs) {
          if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            try {
              imgs = p.images.map((u: string) => resolveAssetUrl(u) || u)
            } catch { imgs = null }
          } else {
            const legacy = localStorage.getItem(`postImage:${p.id}`)
            if (legacy) imgs = [legacy]
          }
        }
        // attach any local profile avatar for the author so UI can show the uploaded avatar immediately
        let clientAuthorImage: string | null = null
        try { clientAuthorImage = localStorage.getItem(`profileImage:${p.authorId}`) } catch { clientAuthorImage = null }
        // if this post belongs to the current user and we have a user.avatarUrl, prefer that (resolved)
        const resolvedUserAvatar = (user && user.avatarUrl) ? resolveAssetUrl(user.avatarUrl) : null
        const finalAuthorImage = clientAuthorImage ?? ((user && p.authorId === user.id) ? resolvedUserAvatar : null)
        return { ...p, _clientImages: imgs ?? null, _clientAuthorImage: finalAuthorImage ?? null }
      })
      // build initial liked map from response if present
      const likesMap: Record<string, boolean> = {}
      list.forEach((p: any) => { if (typeof p.liked !== 'undefined') likesMap[p.id] = !!p.liked })
      setLikedMap(curr => ({ ...curr, ...likesMap }))
      if (replace) setPosts(list)
      else setPosts(curr => [...curr, ...list])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      setError(err.message || 'Error loading posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial page
    setPage(0)
    load(0, true)
  }, [token])

  // listen for cross-component updates (new posts, profile changes)
  useEffect(() => {
    const handler = () => {
      setPage(0)
      load(0, true)
    }
    window.addEventListener('posts:updated', handler as EventListener)
    window.addEventListener('profile:updated', handler as EventListener)
    return () => {
      window.removeEventListener('posts:updated', handler as EventListener)
      window.removeEventListener('profile:updated', handler as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setActionMsg(null)
    try {
      const currentContent = content
      let created: any = null
      if (selectedImages && selectedImages.length > 0) {
        const fd = new FormData()
        fd.append('content', content)
        selectedImages.forEach(f => fd.append('images', f))
        created = await fetcher('/posts', { method: 'POST', body: fd })
      } else {
        created = await fetcher('/posts', { method: 'POST', body: JSON.stringify({ content }) })
      }
      // Try to persist selected image for the created post.
      if (selectedImagePreviews && selectedImagePreviews.length > 0) {
        if (created && created.id) {
          try { localStorage.setItem(`postImages:${created.id}`, JSON.stringify(selectedImagePreviews)) } catch {}
          try { localStorage.setItem(`postAuthor:${created.id}`, created.authorId || (user && user.id) || '') } catch {}
          // include any local author avatar if present so the new post shows the uploaded profile image
          const clientAuthorImage = (() => {
            try { return localStorage.getItem(`profileImage:${created.authorId || (user && user.id)}`) } catch { return null }
          })()
          // if no local clientAuthorImage, try fallback to current user context avatarUrl and resolve relative paths
          const resolvedUserAvatar = (user && user.avatarUrl) ? resolveAssetUrl(user.avatarUrl) : null
          const finalAuthorImage = clientAuthorImage ?? resolvedUserAvatar ?? null
          if (finalAuthorImage && !clientAuthorImage) {
            try { localStorage.setItem(`profileImage:${created.authorId || (user && user.id)}`, finalAuthorImage) } catch {}
          }
          setPosts(curr => [{ ...created, _clientImages: selectedImagePreviews, _clientAuthorImage: finalAuthorImage ?? null }, ...curr])
        } else {
          await load()
          const found = posts.concat().sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).find((pp:any)=>pp.content===currentContent)
            if (found && found.id) {
            try { localStorage.setItem(`postImages:${found.id}`, JSON.stringify(selectedImagePreviews)) } catch {}
            try { localStorage.setItem(`postAuthor:${found.id}`, (user && user.id) || '') } catch {}
            const clientAuthorImage = (() => { try { return localStorage.getItem(`profileImage:${(user && user.id) || ''}`) } catch { return null } })()
            const resolvedUserAvatar = (user && user.avatarUrl) ? resolveAssetUrl(user.avatarUrl) : null
            const finalAuthorImage = clientAuthorImage ?? resolvedUserAvatar ?? null
            if (finalAuthorImage && !clientAuthorImage) {
              try { localStorage.setItem(`profileImage:${(user && user.id) || ''}`, finalAuthorImage) } catch {}
            }
            setPosts(curr => curr.map(p => p.id === found.id ? { ...p, _clientImages: selectedImagePreviews, _clientAuthorImage: finalAuthorImage ?? null } : p))
          }
        }
      }
      setContent('')
      setSelectedImages([])
      setSelectedImagePreviews([])
      setActionMsg('Post creado')
      // ensure posts list is fresh - reload first page
      setPage(0)
      await load(0, true)
      // notify other parts of the app that posts changed
      try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
      setShowCreateModal(false)
    } catch (err: any) {
      setError(err.message || 'Error creating post')
    } finally {
      setCreating(false)
    }
  }

  const toggleLike = async (id: string) => {
    setLikingId(id)
    setActionMsg(null)
    try {
      const res: any = await fetcher(`/posts/${id}/like`, { method: 'POST' })
      // update local post like counts and local liked map
      setPosts(curr => curr.map(p => p.id === id ? { ...p, totalLikes: res.totalLikes, liked: !!res.liked } : p))
      setLikedMap(curr => ({ ...curr, [id]: !!res.liked }))
      setActionMsg(res.liked ? 'Liked' : 'Unliked')
      try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
    } catch (err: any) {
      setError(err.message || 'Error liking post')
    } finally {
      setLikingId(null)
    }
  }

  const onImageChange = (files?: FileList | null) => {
    if (!files || files.length === 0) return
    const max = 10
    const arrAll = Array.from(files)
    const arr = arrAll.slice(0, max)
    setSelectedImages(arr)
    const previews: string[] = []
    let loaded = 0
    arr.forEach((f, idx) => {
      const reader = new FileReader()
      reader.onload = () => {
        previews[idx] = reader.result as string
        loaded++
        if (loaded === arr.length) setSelectedImagePreviews(previews)
      }
      reader.readAsDataURL(f)
    })
    if (arrAll.length > max) setActionMsg(`Se han seleccionado ${arrAll.length} imágenes; se usarán las primeras ${max}.`)
  }

  const setPostCarouselIndex = (postId: string, idx: number) => {
    setCarouselIndex(curr => ({ ...curr, [postId]: idx }))
  }

  const loadMore = async () => {
    if (loadingMore) return
    const next = page + 1
    const placeholderId = `__placeholder-${next}`
    // record scroll so we can restore it after items load
    const prevScroll = typeof window !== 'undefined' ? window.scrollY : 0
    // append a skeleton placeholder item
    setPosts(curr => [...curr, { id: placeholderId, __placeholder: true } as any])
    setLoadingMore(true)
    try {
      await load(next, false)
      setPage(next)
    } catch (e: any) {
      setError(e?.message || 'Error cargando más')
    } finally {
      // remove placeholder and restore scroll position
      setPosts(curr => curr.filter(p => p.id !== placeholderId))
      setTimeout(() => { try { window.scrollTo(0, prevScroll) } catch {} }, 50)
      setLoadingMore(false)
    }
  }

  // auto-load when reaching near bottom of page
  useEffect(() => {
    const onScroll = () => {
      if (loadingMore || loading) return
      if (total && posts.length >= total) return
      const threshold = 200
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold) {
        loadMore()
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [posts, total, loadingMore, loading, page])

  return (
    <div className="container-max mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Posts</h2>
        {actionMsg && <div className="msg-success">{actionMsg}</div>}
        {/* DEV: Clear all button commented out
        {import.meta.env.DEV ? (
          <div>
            <button className="btn-muted" onClick={async () => {
              try {
                await fetcher('/posts/all', { method: 'DELETE' })
                setActionMsg('All posts deleted')
                // notify other components
                try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
              } catch (e: any) { setActionMsg('Delete failed: ' + (e?.message || e)) }
              // reload
              setPage(0)
              await load(0, true)
            }}>Clear all (dev)</button>
          </div>
        ) : null}
        */}
      </div>

      {error && <div className="msg-error mb-4">{error}</div>}

      {token ? (
        <>
          <div className="muted mb-4">Puedes crear un post desde el botón flotante.</div>
          {/* Floating create button */}
          <button
            aria-label="Crear post"
            onClick={() => setShowCreateModal(true)}
            className="fab fab-bounce"
            title="Crear publicación"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showCreateModal && (
            <div className="modal-backdrop z-50">
              <div className="modal-panel">
                <div className="modal-header">
                  <div style={{width:46,height:46,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'#ecfdf5'}}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5v14M5 12h14" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="modal-title">Crear publicación</div>
                </div>
                <form onSubmit={create}>
                  <label className="block text-sm text-slate-600 mb-2">Contenido</label>
                  <textarea className="w-full border rounded-md px-3 py-2 mb-3" value={content} onChange={e => setContent(e.target.value)} />
                  <div className="mb-3">
                    <label className="block text-sm text-slate-600 mb-1">Imágenes (opcional, puedes seleccionar varias)</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" multiple onChange={ev => onImageChange(ev.target.files)} />
                      <button type="button" className="btn-muted" onClick={() => {
                        setSelectedImages([])
                        setSelectedImagePreviews([`https://picsum.photos/seed/local-${Date.now()}/800/400`])
                      }}>Usar imagen por defecto</button>
                    </div>
                    {selectedImagePreviews && selectedImagePreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
                        {selectedImagePreviews.map((p, i) => (
                          <img key={i} src={p} className="rounded-md max-h-32 object-cover w-full" alt={`preview-${i}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex gap-2 justify-end">
                    <button className="btn-muted mr-2" type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                    <button className="btn-base" type="submit" disabled={creating}>{creating ? 'Creando...' : 'Crear'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="muted mb-4">Inicia sesión para crear o darle like a los posts.</div>
      )}

      {loading ? <div className="muted">Cargando...</div> : (
        <div className="posts-grid">
          {posts.map((p: any) => {
            if (p && p.__placeholder) {
              return (
                <article key={p.id} className="post-card" aria-busy>
                  <header className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex flex-col gap-1 w-48">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </header>
                  <div style={{ aspectRatio: '4 / 5', width: '100%', overflow: 'hidden' }} className="carousel-wrap">
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                </article>
              )
            }
            // image precedence: client image (string) overrides default
            const clientImgs: string[] | null = p._clientImages ?? null
            const imgs = clientImgs && clientImgs.length > 0 ? clientImgs : [`https://picsum.photos/seed/${p.id}/800/1000`]
            const currentIdx = carouselIndex[p.id] ?? 0
            const isLiked = likedMap[p.id] ?? !!p.liked
            const authorName = p.authorUsername || (user && p.authorId === user.id ? user.username : `user_${p.authorId?.slice(0,6)}`)
            return (
              <article key={p.id} className="post-card">
                <header className="flex items-center gap-3 p-3">
                  {
                    (() => {
                      try {
                        const raw = p._clientAuthorImage ?? localStorage.getItem(`profileImage:${p.authorId}`)
                        const local = raw ? resolveAssetUrl(raw) : null
                        return <img src={local ?? `https://i.pravatar.cc/48?u=${p.authorId}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      } catch { return <img src={`https://i.pravatar.cc/48?u=${p.authorId}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" /> }
                    })()
                  }
                  <div>
                    <div className="font-medium">{authorName}</div>
                    <div className="text-sm muted">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                </header>
                <div style={{ aspectRatio: '4 / 5', width: '100%', overflow: 'hidden' }} className="carousel-wrap">
                      {imgs.length > 1 ? (
                        <>
                          {imgs.map((src, i) => (
                            <img key={i} src={(resolveAssetUrl(src) || src)} alt={`post-${i}`} className={`carousel-item ${i===currentIdx? 'visible':''} post-img`} />
                          ))}
                          <button onClick={() => setPostCarouselIndex(p.id, (currentIdx - 1 + imgs.length) % imgs.length)} className="carousel-nav-btn absolute left-3 top-1/2 z-30" aria-label="Anterior">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button onClick={() => setPostCarouselIndex(p.id, (currentIdx + 1) % imgs.length)} className="carousel-nav-btn absolute right-3 top-1/2 z-30" aria-label="Siguiente">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 carousel-dots">
                        {imgs.map((_, i) => (
                          <button key={i} onClick={() => setPostCarouselIndex(p.id, i)} className={`carousel-dot ${i===currentIdx? 'active':''}`} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <img className="post-img" src={(resolveAssetUrl(imgs[0]) || imgs[0])} alt="post" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLike(p.id)}
                        disabled={likingId===p.id}
                        aria-pressed={isLiked}
                        className="heart-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" className={`${isLiked ? 'heart-liked' : 'text-gray-400'} transition-all`}>
                          {isLiked ? (
                            <path fill="currentColor" d="M12 21s-6.7-4.6-9.2-7.1C-0.4 10.7 1.1 6.5 4.8 5.2 7 4.4 9.1 5 10 6.2 10.9 5 12.9 4.4 15.2 5.2c3.7 1.3 5.2 5.5 2 8.7-2.5 2.4-9.1 6.9-9.1 6.9z" />
                          ) : (
                            <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12.1 21s-6.7-4.6-9.2-7.1C-0.4 10.7 1.1 6.5 4.8 5.2 7 4.4 9.1 5 10 6.2 10.9 5 12.9 4.4 15.2 5.2c3.7 1.3 5.2 5.5 2 8.7-2.5 2.4-9.1 6.9-9.1 6.9z" />
                          )}
                        </svg>
                        <span className="muted text-sm ml-2">{p.totalLikes}</span>
                      </button>
                    </div>
                    <div className="muted text-sm">{new Date(p.createdAt).toLocaleTimeString()}</div>
                  </div>

                  <div className="text-sm"><span className="font-medium mr-2">{authorName}</span>{p.content}</div>
                </div>
              </article>
            )
          })}
          {posts.length < total && (
            <div className="text-center mt-4">
              <button className="btn-base flex items-center justify-center gap-2" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <span className="spinner" aria-hidden /> : null}
                <span>{loadingMore ? 'Cargando...' : 'Cargar más'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Posts
