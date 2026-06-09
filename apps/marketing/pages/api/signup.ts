import type { NextApiRequest, NextApiResponse } from 'next'

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:8080'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, organization_name } = req.body
  if (!email || !password || !organization_name) {
    return res.status(400).json({ error: { message: 'Missing required fields' } })
  }

  try {
    // Call the onboarding endpoint to create org + user + session atomically
    const onboardResp = await fetch(`${AUTH_SERVICE}/api/v1/auth/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, organization_name })
    })

    const onboardData = await onboardResp.json().catch(()=>null)

    if (!onboardResp.ok) {
      return res.status(onboardResp.status).json(onboardData)
    }

    // Return tokens to the marketing app which will redirect to dashboard
    return res.status(200).json({ tokens: { access_token: onboardData.tokens?.access_token || onboardData.tokens?.AccessToken || onboardData.tokens?.accessToken, refresh_token: onboardData.tokens?.refresh_token || onboardData.tokens?.RefreshToken || onboardData.tokens?.refreshToken } })
  } catch (err:any) {
    console.error(err)
    return res.status(500).json({ error: { message: 'Signup integration error' } })
  }
}
