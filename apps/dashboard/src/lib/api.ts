const baseUrl = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'

type BusinessApiResponse = {
  id: string
  owner_id: string
  name: string
  widget_key: string
  allowed_domains: string[]
  widget_config: string
}

async function apiFetch<T>(path: string, jwt: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export async function createBusiness(name: string, jwt: string): Promise<BusinessApiResponse> {
  return apiFetch<BusinessApiResponse>('/businesses', jwt, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function getMyBusiness(jwt: string): Promise<BusinessApiResponse> {
  return apiFetch<BusinessApiResponse>('/businesses/me', jwt)
}
