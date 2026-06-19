export default function Offline() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#fafaf9', color: '#1c1917' }}>
      <div style={{ width: '4rem', height: '4rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>H</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>You're offline</h1>
      <p style={{ color: '#78716c', textAlign: 'center', maxWidth: '28rem' }}>The HubForge OS interface is cached and ready. You can view past sessions. To run new reasoning, you'll need an internet connection for the AI.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: '#d97706', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
    </div>
  )
}
