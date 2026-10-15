import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export function AdminRoute() { const { user, loading } = useAuth(); if (loading) return <main className="container page"><p>Checking session...</p></main>; if (!user) return <Navigate to="/login" replace />; return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace /> }