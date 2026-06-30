import { useState } from 'react'
import type { FormEvent } from 'react'
import { ID } from 'appwrite'
import { Link, useNavigate } from 'react-router-dom'
import { createBusiness } from '../../lib/api'
import { account, createSessionJwt } from '../../lib/appwrite'
import './auth.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await account.create(ID.unique(), email, password, name)
      await account.createEmailPasswordSession(email, password)
      const jwt = await createSessionJwt()
      await createBusiness(name, jwt)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>

        {error && <p className="auth-error">{error}</p>}

        <label>
          Business name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  )
}
