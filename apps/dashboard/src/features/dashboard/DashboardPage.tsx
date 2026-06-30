import { useEffect, useState } from 'react'
import type { Models } from 'appwrite'
import { useNavigate } from 'react-router-dom'
import { appwriteConfig, isDatabaseConfigured } from '../../lib/appwrite-config'
import { getMyBusiness } from '../../lib/api'
import { account, createSessionJwt, databases } from '../../lib/appwrite'
import type { Plan } from '../../types/database'
import '../auth/auth.css'
import '../../App.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansError, setPlansError] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [widgetKey, setWidgetKey] = useState('')
  const [businessError, setBusinessError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    account.get().then(setUser).catch(() => navigate('/login', { replace: true }))
  }, [navigate])

  useEffect(() => {
    if (!isDatabaseConfigured) {
      setPlansError('Add database + collection IDs to .env.local (see .env.example)')
      return
    }

    databases
      .listDocuments<Plan>(appwriteConfig.databaseId, appwriteConfig.collections.plans)
      .then((response) => setPlans(response.documents))
      .catch((err) => {
        setPlansError(err instanceof Error ? err.message : 'Could not load plans')
      })
  }, [])

  useEffect(() => {
    createSessionJwt()
      .then((jwt) => getMyBusiness(jwt))
      .then((business) => {
        setBusinessName(business.name)
        setWidgetKey(business.widget_key)
      })
      .catch((err) => {
        setBusinessError(err instanceof Error ? err.message : 'Could not load business')
      })
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await account.deleteSession('current')
      navigate('/login', { replace: true })
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <main className="landing">
      <h1>Dashboard</h1>
      <p>Welcome{user ? `, ${user.name}` : ''}.</p>
      <span className="badge">Phase 1 — business created</span>
      {user && <p className="status">{user.email}</p>}

      <section className="plans-section">
        <h2>Your business</h2>
        {businessError && <p className="auth-error">{businessError}</p>}
        {businessName && (
          <ul className="plans-list">
            <li>
              <strong>{businessName}</strong>
              <br />
              <span className="status">Widget key: {widgetKey}</span>
            </li>
          </ul>
        )}
      </section>

      <section className="plans-section">
        <h2>Available plans</h2>
        {plansError && <p className="auth-error">{plansError}</p>}
        {!plansError && plans.length === 0 && <p className="status">No plans yet — seed the Free plan in Appwrite.</p>}
        {plans.length > 0 && (
          <ul className="plans-list">
            {plans.map((plan) => (
              <li key={plan.$id}>
                <strong>{plan.name}</strong> — ₹{plan.price}/mo, {plan.messageQuota} messages
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="btn-secondary logout-btn"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? 'Logging out…' : 'Log out'}
      </button>
    </main>
  )
}
