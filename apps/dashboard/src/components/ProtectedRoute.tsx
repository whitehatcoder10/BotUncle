import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Models } from 'appwrite'
import { Navigate } from 'react-router-dom'
import { account } from '../lib/appwrite'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account
      .get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="landing">
        <p>Checking session…</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
