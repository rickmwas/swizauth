import Link from 'next/link'

export default function Home() {
  return (
    <main style={{fontFamily: 'Inter, system-ui, sans-serif', padding: 40}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{margin:0}}>SwizAuth</h1>
        <nav>
          <Link href="/signup">Start Free</Link>
        </nav>
      </header>

      <section style={{display:'flex', gap: 40, marginTop: 48}}>
        <div style={{flex:1}}>
          <h2>Authentication infrastructure for modern apps</h2>
          <p>Deploy authentication, organizations, roles, permissions and multi-tenant access in minutes.</p>
          <div style={{marginTop:20}}>
            <Link href="/signup"><button style={{padding:'10px 16px'}}>Start Free</button></Link>
            <Link href="/docs"><button style={{marginLeft:12, padding:'10px 16px'}}>View Docs</button></Link>
          </div>

          <h3 style={{marginTop:40}}>Developer Quickstart</h3>
          <pre style={{background:'#f3f4f6', padding:12}}>npm install @swizauth/js</pre>
        </div>
        <div style={{width:360}}>
          <div style={{background:'#111827', color:'#fff', padding:20, borderRadius:8}}>
            <h4>Mock Dashboard</h4>
            <div style={{height:200, background:'#0f172a', borderRadius:6}}></div>
          </div>
        </div>
      </section>

      <section style={{marginTop:60}}>
        <h3>Features</h3>
        <ul>
          <li>Authentication</li>
          <li>Organizations & Multi-Tenancy</li>
          <li>RBAC & Permissions</li>
          <li>API Keys & Developer SDKs</li>
          <li>Audit Logs</li>
        </ul>
      </section>
    </main>
  )
}
