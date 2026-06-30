import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { account } from '../lib/appwrite'

type GuestRouteProps = {
  children: ReactNode
}

/** Redirect to dashboard if already logged in (for /login and /signup). */
export default function GuestRoute({ children }: GuestRouteProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    account
      .get()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false))
  }, [])

  if (isLoggedIn === null) {
    return (
      <main className="landing">
        <p>Checking session…</p>
      </main>
    )
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
