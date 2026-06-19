"use client"
import { useState, useEffect } from "react"
import { BrainCircuit, Users, FileText, Download, Loader2, ShieldCheck, BarChart3, AlertTriangle, Activity, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { cn } from "@/lib/utils"

const ADMIN_KEY_STORAGE = "hubforge.adminKey"

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("")
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("analytics")

  const fetchAll = async (key: string) => {
    setLoading(true); setError("")
    try {
      const [u, a] = await Promise.all([
        fetch(`/api/profile?admin_key=${encodeURIComponent(key)}`).then(r => r.json()),
        fetch(`/api/analytics?admin_key=${encodeURIComponent(key)}&days=30`).then(r => r.json()),
      ])
      setUsers(u.users || []); setAnalyticsData(a)
      localStorage.setItem(ADMIN_KEY_STORAGE, key)
    } catch (e: any) { setError(e.message); setAuthed(false) }
    setLoading(false)
  }
  const handleLogin = () => { setAuthed(true); fetchAll(adminKey) }

  // Load saved admin key on mount (lazy init, no setState in effect)
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_KEY_STORAGE) || '' : ''
  if (savedKey && !authed) {
    setAdminKey(savedKey)
    setAuthed(true)
    fetchAll(savedKey)
  }
  const handleLogout = () => { localStorage.removeItem(ADMIN_KEY_STORAGE); setAuthed(false); setAdminKey(""); setUsers([]); setAnalyticsData(null) }
  const exportCSV = () => {
    const headers = ["Name","Email","Organization","Country","Role","Joined","Last Seen"]
    const rows = users.map((u:any) => [u.name||"",u.email||"",u.organization||"",u.country||"",u.role||"",new Date(u.created_at).toLocaleDateString(),new Date(u.last_seen).toLocaleDateString()])
    const csv = [headers,...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `hubforge-users-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader><div className="flex items-center gap-2.5 mb-2"><div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><BrainCircuit className="h-5 w-5 text-white" /></div><div><CardTitle className="text-base">HubForge OS Admin</CardTitle><p className="text-xs text-muted-foreground">Analytics & user dashboard</p></div></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Admin key</label><Input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter admin key" className="font-mono text-sm" /></div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button onClick={handleLogin} disabled={!adminKey} className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"><ShieldCheck className="h-4 w-4" /> Access dashboard</Button>
          <Link href="/" className="block text-center text-xs text-muted-foreground hover:text-amber-700">Back to app</Link>
        </CardContent>
      </Card>
    </div>
  )

  const a = analyticsData
  const maxDaily = Math.max(...(a?.dailyActive?.map((d:any) => d.users) || [1]), 1)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><BrainCircuit className="h-4 w-4 text-white" /></div><div><div className="font-bold text-sm">HubForge OS - Admin</div><div className="text-[10px] font-mono text-muted-foreground">analytics & users</div></div></div>
          <div className="ml-auto flex gap-2"><Button variant="outline" size="sm" className="text-xs" onClick={() => fetchAll(adminKey)}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}</Button><Button variant="ghost" size="sm" className="text-xs" onClick={handleLogout}>Logout</Button></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[["Total users",users.length,Users],["Unique 30d",a?.summary?.uniqueUsers||0,Activity],["Returning",a?.summary?.returningUsers||0,TrendingUp],["Sessions",a?.summary?.totalSessions||a?.summary?.totalEvents||0,FileText],["Avg score",a?.summary?.avgScore||0,BarChart3],["Avg time",`${a?.summary?.avgDurationSec||0}s`,Activity],["Errors",a?.summary?.totalErrors||0,AlertTriangle]].map(([label,value,Icon]:any,i) => (
            <Card key={i} className="p-3"><div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-amber-600" /><span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span></div><div className="text-lg font-bold">{value}</div></Card>
          ))}
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="analytics" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger><TabsTrigger value="users" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger></TabsList>
          <TabsContent value="analytics" className="space-y-6 mt-4">
            {a && (<>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono flex items-center gap-2"><Activity className="h-4 w-4 text-amber-600" /> Daily active users (30 days)</CardTitle></CardHeader><CardContent><div className="flex items-end gap-1 h-32">{a.dailyActive?.map((d:any,i:number) => (<div key={i} className="flex-1 bg-amber-500 rounded-t-sm" style={{height:`${(d.users/maxDaily)*100}%`,minHeight:d.users>0?"2px":"0"}} title={`${d.date}: ${d.users} users`} />))}</div></CardContent></Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-600" /> Conversion funnel</CardTitle></CardHeader><CardContent className="space-y-2">{[["App opens",a.funnel?.app_open],["Onboarding complete",a.funnel?.onboarding_complete],["Runs started",a.funnel?.run_start],["Runs completed",a.funnel?.run_complete],["Outputs viewed",a.funnel?.output_viewed],["Feedback given",a.funnel?.feedback_given]].map(([label,val]:any,i) => { const pct = a.funnel?.app_open > 0 ? Math.round((val/a.funnel.app_open)*100) : 0; return (<div key={i} className="flex items-center gap-2"><span className="text-xs w-32 shrink-0 text-right">{label}</span><div className="flex-1 h-6 bg-muted rounded relative overflow-hidden"><div className="h-full bg-amber-500/70 rounded" style={{width:`${pct}%`}} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">{val}</span><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">{pct}%</span></div></div>) })}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Quality score distribution</CardTitle></CardHeader><CardContent><div className="space-y-2">{[["Below 60",a.scoreBuckets?.below60,"bg-red-500"],["60-79",a.scoreBuckets?.["60-79"],"bg-amber-500"],["80-89",a.scoreBuckets?.["80-89"],"bg-emerald-500"],["90+",a.scoreBuckets?.["90+"],"bg-emerald-600"]].map(([label,val,color]:any,i) => { const total = (a.scoreBuckets?.below60||0)+(a.scoreBuckets?.["60-79"]||0)+(a.scoreBuckets?.["80-89"]||0)+(a.scoreBuckets?.["90+"]||0); const pct = total > 0 ? Math.round((val/total)*100) : 0; return (<div key={i} className="flex items-center gap-2"><span className="text-xs w-20 shrink-0">{label}</span><div className="flex-1 h-6 bg-muted rounded relative overflow-hidden"><div className={cn("h-full rounded",color)} style={{width:`${pct}%`}} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">{val}</span></div><span className="text-[9px] text-muted-foreground w-8">{pct}%</span></div>) })}</div></CardContent></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Output types used</CardTitle></CardHeader><CardContent>{a.outputTypeUsage?.length === 0 ? <p className="text-xs text-muted-foreground">No data</p> : <div className="space-y-1">{a.outputTypeUsage?.map(([t,c]:any) => <div key={t} className="flex justify-between text-xs"><span className="capitalize">{t}</span><span className="font-mono font-bold">{c}</span></div>)}</div>}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono">AI providers used</CardTitle></CardHeader><CardContent>{a.providerUsage?.length === 0 ? <p className="text-xs text-muted-foreground">No data</p> : <div className="space-y-1">{a.providerUsage?.map(([p,c]:any) => <div key={p} className="flex justify-between text-xs"><span>{p}</span><span className="font-mono font-bold">{c}</span></div>)}</div>}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Top events</CardTitle></CardHeader><CardContent>{a.eventTypeCounts?.length === 0 ? <p className="text-xs text-muted-foreground">No events</p> : <ScrollArea className="h-40"><div className="space-y-1">{a.eventTypeCounts?.slice(0,15).map(([t,c]:any) => <div key={t} className="flex justify-between text-xs"><span className="truncate">{t}</span><span className="font-mono font-bold shrink-0 ml-2">{c}</span></div>)}</div></ScrollArea>}</CardContent></Card>
              </div>
              {a.recentErrors?.length > 0 && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm font-mono flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Recent errors</CardTitle></CardHeader><CardContent><ScrollArea className="h-48"><div className="space-y-1.5">{a.recentErrors.map((err:any,i:number) => <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border last:border-0"><Badge variant="outline" className="text-[9px] font-mono shrink-0 text-red-600 border-red-300">{err.type}</Badge><span className="flex-1 text-muted-foreground truncate">{err.message}</span><span className="text-[9px] text-muted-foreground font-mono shrink-0">{new Date(err.time).toLocaleString()}</span></div>)}</div></ScrollArea></CardContent></Card>)}
            </>)}
          </TabsContent>
          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="flex justify-between"><Input placeholder="Search..." className="w-64 text-xs h-8" onChange={e => {/* TODO: filter */}} /><Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" /> Export CSV</Button></div>
            <Card><CardContent className="p-0">
              {users.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">No users yet.</div> : (
                <ScrollArea className="h-[500px]"><Table><TableHeader><TableRow>{["Name","Email","Organization","Country","Role","Joined","Last seen"].map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader><TableBody>{users.map((u:any,i:number) => <TableRow key={i}>{[u.name,u.email,u.organization,u.country,u.role,u.created_at?new Date(u.created_at).toLocaleDateString():"-",u.last_seen?new Date(u.last_seen).toLocaleDateString():"-"].map((v,j) => <TableCell key={j} className="text-xs">{v || <span className="text-muted-foreground italic">-</span>}</TableCell>)}</TableRow>)}</TableBody></Table></ScrollArea>
              )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
