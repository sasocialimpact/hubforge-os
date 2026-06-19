'use client'

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-stone-50 text-stone-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-white">H</div>
      <h1 className="text-2xl font-bold">You're offline</h1>
      <p className="text-sm text-stone-500 text-center max-w-md">The HubForge OS interface is cached and ready. You can view past sessions. To run new reasoning, you'll need an internet connection for the AI.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-lg bg-amber-600 text-white font-semibold">Try again</button>
    </div>
  )
}
