import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfile } from '../services/api'

export default function ProfilePage() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('api_token')

    if (!token) {
      navigate('/', { replace: true })

      return
    }

    let active = true

    fetchProfile(token)
      .then((response) => {
        if (active) {
          setProfile(response.data)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('api_token')
    navigate('/')
  }

  return (
    <section className="card">
      <h1 className="card__title">Profile</h1>
      <p className="card__subtitle">Data returned by the GET /api/profile endpoint.</p>

      {loading && <p className="state">Loading…</p>}
      {!loading && error && <p className="state state--error">{error}</p>}

      {!loading && !error && profile && (
        <dl className="profile">
          <dt>ID</dt>
          <dd>{profile.id}</dd>
          <dt>Email</dt>
          <dd>{profile.email}</dd>
          <dt>Gender</dt>
          <dd>{profile.gender}</dd>
          <dt>Created at</dt>
          <dd>{profile.created_at}</dd>
        </dl>
      )}

      <button className="button button--ghost" type="button" onClick={handleLogout}>
        Log out
      </button>
    </section>
  )
}
