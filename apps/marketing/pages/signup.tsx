import { useState } from 'react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, organization_name: orgName })
      })
      const data = await resp.json()
      if (resp.ok) {
        // If token returned, redirect to dashboard with token
        if (data.tokens?.access_token) {
          const params = new URLSearchParams({ token: data.tokens.access_token })
          window.location.href = `https://app.swizauth.com/?${params.toString()}`
        } else {
          setMessage('Registration complete — please sign in via the dashboard.')
        }
      } else {
        setMessage(data.error?.message || 'Signup failed')
      }
    } catch (err:any) {
      setMessage(err.message || 'Signup failed')
    }
  }

  return (
    <main style={{padding:40}}>
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit} style={{maxWidth:480}}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} required style={{display:'block', width:'100%', padding:8}} />
        <label style={{marginTop:8}}>Organization name</label>
        <input value={orgName} onChange={e=>setOrgName(e.target.value)} required style={{display:'block', width:'100%', padding:8}} />
        <label style={{marginTop:8}}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{display:'block', width:'100%', padding:8}} />
        <div style={{marginTop:12}}>
          <button type="submit">Create account</button>
        </div>
      </form>
      {message && <p style={{marginTop:12}}>{message}</p>}
    </main>
  )
}
