import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export function ProtectedRoute() { const { user, loading } = useAuth(); if (loading) return <main className="container page"><p>Checking session...</p></main>; return user ? <Outlet /> : <Navigate to="/login" replace /> }