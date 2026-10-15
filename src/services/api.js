const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

/**
 * Perform an HTTP request against the API and log it to the console.
 *
 * @param {string} method HTTP method
 * @param {string} path API path (e.g. /registration)
 * @param {{ body?: object, token?: string }} options Request options
 * @returns {Promise<object>} Parsed JSON response
 */
async function request(method, path, { body, token } = {}) {
  const url = `${API_BASE_URL}${path}`
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    method,
    url,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }

  console.log(`[API] ${method} ${url}`, config)

  const response = await fetch(url, config)
  const data = await response.json().catch(() => null)

  console.log(`[API] ${method} ${url} -> ${response.status}`, data)

  if (!response.ok) {
    const error = new Error(data?.message ?? 'Request failed')
    error.status = response.status
    error.errors = data?.errors
    throw error
  }

  return data
}

/**
 * Send a registration request.
 *
 * @param {{ email: string, password: string, gender: string }} payload Registration payload
 * @returns {Promise<object>} Created user together with the access token
 */
export function register(payload) {
  return request('POST', '/registration', { body: payload })
}

/**
 * Fetch the authenticated user's profile.
 *
 * @param {string} token Bearer token
 * @returns {Promise<object>} Profile response
 */
export function fetchProfile(token) {
  return request('GET', '/profile', { token })
}

export { API_BASE_URL }
