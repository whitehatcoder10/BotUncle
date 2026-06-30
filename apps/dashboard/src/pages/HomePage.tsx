import { Link } from 'react-router-dom'
import '../App.css'

function HomePage() {
  return (
    <main className="landing">
      <h1>BotUncle</h1>
      <p>AI-powered support chatbots for your business.</p>
      <div className="landing-actions">
        <Link className="btn-primary" to="/signup">
          Get started
        </Link>
        <Link className="btn-secondary" to="/login">
          Log in
        </Link>
      </div>
    </main>
  )
}

export default HomePage
