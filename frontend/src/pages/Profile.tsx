import React, { useEffect, useState, useContext } from 'react'
import { useApi, resolveAssetUrl } from '../api/client'
import { AuthContext } from '../context/AuthContext'

const Profile: React.FC = () => {
  const { fetcher } = useApi()
  const { user, setUser } = useContext(AuthContext)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [showPostModal, setShowPostModal] = useState(false)
    const [selectedPost, setSelectedPost] = useState<any | null>(null)
    const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})
    const [showEditModal, setShowEditModal] = useState(false)
    const [likingId, setLikingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetcher('/users/me')
      .then((p) => setProfile(p))
      .catch((e: any) => setError(e.message || 'No autorizado'))
      .finally(() => setLoading(false))
  }, [])

  // load posts for the profile (separate function so we can call it on demand)
  const loadPosts = async () => {
    if (!profile) return
    try {
      // request many items to ensure recent posts are included
      const res = await fetcher(`/posts?page=0&size=1000`)
      const all = (res && res.items) || []
      // prefer backend images when present; also include client-local posts
      let mine = all
        .filter((pp: any) => pp.authorId === profile.id)
        .map((pp: any) => {
          // if backend returned images array, resolve asset URLs
          let imgs: string[] | null = null
          try { if (pp.images && Array.isArray(pp.images) && pp.images.length > 0) imgs = pp.images.map((u: string) => resolveAssetUrl(u) || u) } catch { imgs = null }
          return { ...pp, _clientImages: imgs ?? null }
        })
      // include any client-local posts that may not be present in API result
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
                if (key.startsWith('postImages:')) {
            const id = key.split(':')[1]
            // ensure the local images are actually authored by this profile (if recorded)
            const authorKey = localStorage.getItem(`postAuthor:${id}`)
            if (authorKey && authorKey !== String(profile.id)) continue
            if (!all.some((a: any) => a.id === id) && !mine.some((m: any) => m.id === id)) {
              try {
                const imgs = JSON.parse(localStorage.getItem(key) || '[]')
                const placeholder = { id, authorId: profile.id, _clientImages: imgs, content: '', totalLikes: 0, createdAt: new Date().toISOString() }
                mine.push(placeholder)
              } catch { }
            }
          }
        }
      } catch { }
      // sort newest first
      mine.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPosts(mine)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username || '')
      const img = localStorage.getItem(`profileImage:${profile.id}`)
      if (img) setImagePreview(resolveAssetUrl(img) || img)
      loadPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  // listen for cross-component updates (posts created/liked elsewhere)
  useEffect(() => {
    const handler = () => loadPosts()
    window.addEventListener('posts:updated', handler as EventListener)
    return () => window.removeEventListener('posts:updated', handler as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

    const toggleLikePost = async (id: string) => {
      setLikingId(id)
      try {
        const res: any = await fetcher(`/posts/${id}/like`, { method: 'POST' })
        // update local posts list and selectedPost
        setPosts(curr => curr.map(p => p.id === id ? { ...p, totalLikes: res.totalLikes, liked: !!res.liked } : p))
        if (selectedPost && selectedPost.id === id) setSelectedPost(prev => prev ? ({ ...prev, totalLikes: res.totalLikes, liked: !!res.liked }) : prev)
          try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
      } catch (e) {
        // ignore
      } finally {
        setLikingId(null)
      }
    }

  const onImageChange = (f?: FileList | null) => {
    if (!f || f.length === 0) return
    const file = f[0]
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!profile) return
    // persist avatar locally
    try {
      if (imagePreview) localStorage.setItem(`profileImage:${profile.id}`, imagePreview)
      // persist to backend if possible
      if (user) {
        try {
          await fetcher('/users/me', { method: 'PATCH', body: JSON.stringify({ username: usernameInput }) })
        } catch (e) {
          // ignore error but continue
        }
        // if avatar file selected, upload it
        if (avatarFile) {
          try {
            const fd = new FormData()
            fd.append('avatar', avatarFile)
            await fetcher('/users/me/avatar', { method: 'PATCH', body: fd })
          } catch (e) {
            // ignore
          }
        }
        // fetch updated profile from server to get avatarUrl if backend stored it
        try {
          const refreshed = await fetcher('/users/me')
          if (refreshed) {
            // if backend provided an avatarUrl, persist it to localStorage and update preview
            if (refreshed.avatarUrl) {
              try { localStorage.setItem(`profileImage:${refreshed.id}`, refreshed.avatarUrl) } catch {}
              setImagePreview(resolveAssetUrl(refreshed.avatarUrl) || refreshed.avatarUrl)
            }
            // update user context
            setUser(refreshed)
            setProfile(refreshed)
          }
        } catch (e) {
          // ignore
        }
      }
      // update local user context so UI reflects change immediately
      const updated = { ...(user || {}), username: usernameInput }
      setUser(updated)
      // update profile view
      setProfile(prev => ({ ...prev, username: usernameInput }))
      setEditing(false)
      try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
      try { window.dispatchEvent(new CustomEvent('profile:updated')) } catch {}
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
    <div className="container-max mx-auto">
      <div className="card-ui max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-2">Profile</h2>
        {loading && <div className="muted">Cargando...</div>}
        {error && <div className="msg-error">{error}</div>}
        {profile && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex justify-center md:justify-start">
                <img src={imagePreview ?? `https://i.pravatar.cc/256?u=${profile.id}`} alt="avatar" className="w-48 h-48 rounded-full object-cover transition-transform duration-200 hover:scale-105 shadow-sm" />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-slate-600">Username</div>
                <div className="text-lg font-medium flex items-center gap-3">
                  {profile.username}
                  <button onClick={() => setShowEditModal(true)} className="text-emerald-600 font-medium text-sm">Editar</button>
                  {/* DEV: Clear local button commented out
                  {import.meta.env.DEV ? (
                    <button
                      onClick={() => {
                        try {
                          // remove local profile/post image entries
                          const keys = Object.keys(localStorage)
                          for (const k of keys) {
                            if (k.startsWith('profileImage:') || k.startsWith('postImages:') || k.startsWith('postAuthor:')) {
                              localStorage.removeItem(k)
                            }
                          }
                        } catch (e) {}
                        try { window.dispatchEvent(new CustomEvent('posts:updated')) } catch {}
                        try { window.dispatchEvent(new CustomEvent('profile:updated')) } catch {}
                        // reload so UI reflects cleared localStorage
                        setTimeout(() => location.reload(), 80)
                      }}
                      className="ml-3 text-red-500 text-sm"
                    >Clear local
                    </button>
                  ) : null}
                  */}
                </div>
                <div className="mt-3 text-sm muted">ID: {profile.id}</div>
              </div>
            </div>
            {/* Gallery grid similar to Instagram (larger tiles) */}
            <div className="mt-6">
              <div className="profile-gallery">
                {posts.map((pp, idx) => {
                  const imgs = pp._clientImages && pp._clientImages.length > 0 ? pp._clientImages : [`https://picsum.photos/seed/${pp.id}/600/600`]
                  return (
                    <button key={pp.id} onClick={() => { setSelectedPost(pp); setCarouselIndex(curr => ({ ...curr, [pp.id]: 0 })); setShowPostModal(true) }} className="profile-thumb">
                      <img src={imgs[0]} alt={`post-${idx}`} />
                      <div className="thumb-overlay">
                        <div className="thumb-meta">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.7-4.6-9.2-7.1C-0.4 10.7 1.1 6.5 4.8 5.2 7 4.4 9.1 5 10 6.2 10.9 5 12.9 4.4 15.2 5.2c3.7 1.3 5.2 5.5 2 8.7-2.5 2.4-9.1 6.9-9.1 6.9z" fill="white"/></svg>
                          <span style={{fontSize:13}}>{pp.totalLikes ?? 0}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {showPostModal && selectedPost && (
      <div className="modal-backdrop z-50">
        <div className="modal-panel" style={{maxWidth:1100,display:'flex',padding:0}}>
          <div style={{flex:'0 0 68%'}} className="modal-image flex items-center justify-center">
              <div className="modal-gallery" style={{position:'relative', width:'100%', height:'86vh'}}>
                  {(() => {
                    const imgs = selectedPost._clientImages && selectedPost._clientImages.length > 0 ? selectedPost._clientImages : [`https://picsum.photos/seed/${selectedPost.id}/900/900`]
                    const currentIdx = carouselIndex[selectedPost.id] ?? 0
                    if (imgs.length > 1) {
                      return (
                        <>
                          {imgs.map((src: string, i: number) => (
                            <div key={i} className={`carousel-item ${i===currentIdx? 'visible':''}`}>
                              <img src={(resolveAssetUrl(src) || src)} alt={`post-${i}`} className="w-full h-full" />
                            </div>
                          ))}
                          <button onClick={() => setCarouselIndex(curr => {
                            const now = (curr[selectedPost.id] ?? currentIdx)
                            return { ...curr, [selectedPost.id]: (now - 1 + imgs.length) % imgs.length }
                          })} className="carousel-nav-btn absolute left-3 top-1/2 z-30" aria-label="Anterior">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => setCarouselIndex(curr => {
                            const now = (curr[selectedPost.id] ?? currentIdx)
                            return { ...curr, [selectedPost.id]: (now + 1) % imgs.length }
                          })} className="carousel-nav-btn absolute right-3 top-1/2 z-30" aria-label="Siguiente">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </>
                      )
                    }
                    return (
                      <div className="carousel-item visible" style={{width:'100%',height:'100%'}}>
                        <img src={(resolveAssetUrl(imgs[0]) || imgs[0])} alt="post" className="w-full h-full" />
                      </div>
                    )
                  })()}
              </div>
          </div>
          <div style={{flex:1,maxHeight:'80vh',overflow:'auto'}} className="p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {(() => {
                    try {
                      const raw = localStorage.getItem(`profileImage:${selectedPost.authorId}`)
                      const prefRaw = (selectedPost.authorId === (user && user.id)) ? ((profile && profile.avatarUrl) || (user && user.avatarUrl) || raw) : raw
                      const preferredForCurrent = prefRaw ? resolveAssetUrl(prefRaw) : null
                      return <img src={preferredForCurrent ?? `https://i.pravatar.cc/48?u=${selectedPost.authorId}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    } catch { return <img src={`https://i.pravatar.cc/48?u=${selectedPost.authorId}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" /> }
                })()}
                <div>
                  <div className="font-medium">{selectedPost.authorUsername || 'Usuario'}</div>
                  <div className="text-sm muted">{new Date(selectedPost.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleLikePost(selectedPost.id)} disabled={likingId===selectedPost.id} className="btn-muted">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={selectedPost.liked ? 'red' : 'none'} stroke="currentColor"><path d="M12 21s-6.7-4.6-9.2-7.1C-0.4 10.7 1.1 6.5 4.8 5.2 7 4.4 9.1 5 10 6.2 10.9 5 12.9 4.4 15.2 5.2c3.7 1.3 5.2 5.5 2 8.7-2.5 2.4-9.1 6.9-9.1 6.9z" /></svg>
                  </button>
                  <div className="text-sm muted">{selectedPost.totalLikes ?? 0}</div>
                </div>
                <button onClick={() => setShowPostModal(false)} className="btn-muted" aria-label="Cerrar">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none"><path d="M6 6l12 12M6 18L18 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm"><span className="font-medium mr-2">{selectedPost.authorUsername}</span>{selectedPost.content}</div>
            </div>
            <div className="mt-4">
              <div className="text-sm muted mb-2">Comentarios</div>
              <div className="p-3 bg-gray-50 rounded">No hay comentarios (demo)</div>
            </div>
          </div>
        </div>
      </div>
    )}
    {showEditModal && profile && (
      <div className="modal-backdrop z-50">
        <div className="modal-panel" style={{maxWidth:640}}>
            <div className="modal-header">
            <div style={{width:46,height:46,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'#ecfdf5'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="modal-title">Editar perfil</div>
          </div>
          <div>
            <label className="block text-sm text-slate-600">Username</label>
            <input value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="border rounded px-3 py-2 w-full mt-1" />
            <div className="mt-3">
              <label className="block text-sm text-slate-600">Avatar (opcional)</label>
              <input type="file" accept="image/*" onChange={e => onImageChange(e.target.files)} className="mt-2 block w-full max-w-xs" />
              {imagePreview && <img src={imagePreview} alt="preview" className="mt-3 w-28 h-28 rounded-full object-cover" />}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-muted" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-base" onClick={async () => { await saveProfile(); setShowEditModal(false) }}>Guardar</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Profile

// Post modal (rendered outside main return via conditional at module level)
