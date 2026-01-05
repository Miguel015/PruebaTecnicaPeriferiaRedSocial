import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, AuthContext } from './context/AuthContext'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Posts from './pages/Posts'
import './styles.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-bg min-h-screen">
            <Header />
          <main>
            <AuthRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

const Nav: React.FC = () => {
  const { token, setToken, user } = React.useContext(AuthContext)
  const nav = useNavigate()
  const location = useLocation()

  // hide navigation when Login is being shown (either explicit /login
  // or unauthenticated root path which renders <Login />)
  if (!token && (location.pathname === '/' || location.pathname.startsWith('/login'))) return null

  const logout = () => {
    setToken(null)
    nav('/login')
  }

  return (
    <nav className="flex items-center gap-4">
      {token ? (
        <>
          <Link className="text-emerald-600 font-medium hover:underline" to="/">Posts</Link>
          <Link className="text-emerald-600 font-medium hover:underline" to="/profile">Profile</Link>
          <div className="ml-4">
            <button className="btn-muted" onClick={logout}>Logout</button>
          </div>
        </>
      ) : (
        <Link className="text-emerald-600 font-medium hover:underline" to="/login">Login</Link>
      )}
    </nav>
  )
}

const Header: React.FC = () => {
  const location = useLocation()
  const { token } = React.useContext(AuthContext)

  // hide full header when showing login (explicit /login or unauthenticated root)
  if (!token && (location.pathname === '/' || location.pathname.startsWith('/login'))) return null

  return (
    <header className="bg-white shadow-sm">
      <div className="container-max mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Periferia Demo</h1>
        <Nav />
      </div>
    </header>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

const AuthRoutes: React.FC = () => {
  const { token } = React.useContext(AuthContext)
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={token ? <Profile /> : <Login />} />
      <Route path="/" element={token ? <Posts /> : <Login />} />
    </Routes>
  )
}
