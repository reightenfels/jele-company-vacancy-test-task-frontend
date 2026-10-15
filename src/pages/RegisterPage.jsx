import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../services/api'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const genders = [
  { value: '', label: 'Select gender…' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', gender: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: field === 'email' ? value.trim() : value }))
  }

  const validate = () => {
    const result = {}

    if (!emailPattern.test(form.email)) {
      result.email = 'Enter a valid email address.'
    }

    if (form.password.length < 8) {
      result.password = 'Password must be at least 8 characters.'
    }

    if (!form.gender) {
      result.gender = 'Please select a gender.'
    }

    setErrors(result)

    return Object.keys(result).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setErrors({})

    if (!validate()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await register({ ...form })
      localStorage.setItem('api_token', response.token)
      navigate('/profile')
    } catch (error) {
      setErrors(error.errors ?? { email: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h1 className="card__title">Create account</h1>
      <p className="card__subtitle">Fill in the form to register a new user.</p>

      <form className="form" noValidate onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field__input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange('email')}
          />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password">
            Password
          </label>
          <div className="field__password">
            <input
              id="password"
              className="field__input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange('password')}
            />
            <button
              className="field__toggle"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <span className="field__error">{errors.password}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="gender">
            Gender
          </label>
          <select
            id="gender"
            className="field__input field__select"
            value={form.gender}
            onChange={handleChange('gender')}
          >
            {genders.map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === ''}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.gender && <span className="field__error">{errors.gender}</span>}
        </div>

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Register'}
        </button>
      </form>
    </section>
  )
}
