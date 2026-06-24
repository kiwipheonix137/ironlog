import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './components/AuthProvider'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import HistoryPage from './pages/HistoryPage'
import PRPage from './pages/PRPage'
import ProgressPage from './pages/ProgressPage'
import BodyweightPage from './pages/BodyweightPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.1em' }}>
      LOADING...
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="log" element={<LogPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="prs" element={<PRPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="bodyweight" element={<BodyweightPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
