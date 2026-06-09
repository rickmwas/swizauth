import type { NextApiRequest, NextApiResponse } from 'next'

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:8080'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, organization_name } = req.body
  if (!email || !password || !organization_name) {
    return res.status(400).json({ error: { message: 'Missing required fields' } })
  }

  try {
    // Attempt to create a new organization via internal admin API (not implemented yet)
    // Fallback: call /auth/register with a placeholder organization id is not possible.
    // For now, call /auth/login after assuming registration handled elsewhere.

    // Try to register (expects organization_id currently) - we call a best-effort endpoint
    const registerResp = await fetch(`${AUTH_SERVICE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, organization_id: process.env.DEFAULT_ORG_ID })
    })

    const registerData = await registerResp.json().catch(()=>null)

    // After register, try to login to obtain tokens
    const loginResp = await fetch(`${AUTH_SERVICE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const loginData = await loginResp.json()

    if (!loginResp.ok) {
      return res.status(loginResp.status).json(loginData)
    }

    // Return tokens to the marketing app which will redirect to dashboard
    return res.status(200).json({ tokens: { access_token: loginData.access_token || loginData.AccessToken || loginData.accessToken, refresh_token: loginData.refresh_token || loginData.RefreshToken || loginData.refreshToken } })
  } catch (err:any) {
    console.error(err)
    return res.status(500).json({ error: { message: 'Signup integration error' } })
  }
}
