import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  plan: string;
  role: string;
  created_at: string;
}

interface Token {
  id: number;
  address: string;
  name: string;
  symbol: string;
  status: string;
  source: string;
  created_at: string;
}

interface AdminStats {
  totalTokens: number;
  safeTokens: number;
  riskyTokens: number;
  totalWallets: number;
  totalUsers: number;
  bySource: Record<string, number>;
}

export default function Admin() {
  const [tab, setTab] = useState<"overview" | "users" | "tokens" | "scan">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [editUser, setEditUser] = useState<{ id: number; plan: string; role: string } | null>(null);
  const token = localStorage.getItem("token");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === "users") fetchUsers(); if (tab === "tokens") fetchTokens(); }, [tab]);

  async function fetchStats() {
    try {
      const r = await fetch("/api/admin/stats", { headers });
      if (r.ok) setStats(await r.json());
    } catch {}
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { headers });
      if (r.ok) setUsers((await r.json()).users || []);
    } catch {} finally { setLoading(false); }
  }

  async function fetchTokens() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/tokens?limit=50", { headers });
      if (r.ok) setTokens((await r.json()).tokens || []);
    } catch {} finally { setLoading(false); }
  }

  async function triggerScan() {
    setScanMsg("Scanning...");
    try {
      const r = await fetch("/api/admin/scan", { method: "POST", headers });
      const d = await r.json();
      setScanMsg(d.message || "Scan triggered!");
      setTimeout(() => { fetchStats(); }, 3000);
    } catch { setScanMsg("Error triggering scan"); }
  }

  async function saveUserEdit() {
    if (!editUser) return;
    try {
      await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ plan: editUser.plan, role: editUser.role })
      });
      setEditUser(null);
      fetchUsers();
    } catch {}
  }

  async function deleteToken(id: number) {
    if (!confirm("Delete this token?")) return;
    await fetch(`/api/admin/tokens/${id}`, { method: "DELETE", headers });
    fetchTokens();
  }

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = { free: "bg-gray-100 text-gray-600", pro: "bg-blue-100 text-blue-700", business: "bg-violet-100 text-violet-700" };
    return `px-2 py-0.5 rounded-full text-xs font-semibold ${colors[plan] || "bg-gray-100 text-gray-600"}`;
  };

  const roleBadge = (role: string) => role === "admin"
    ? "px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"
    : "px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500";

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { safe: "bg-green-100 text-green-700", risky: "bg-red-100 text-red-700", unknown: "bg-yellow-100 text-yellow-700" };
    return `px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg">⚙️</div>
            <div>
              <h1 className="text-white font-bold text-xl">Admin Dashboard</h1>
              <p className="text-violet-200 text-xs">CryptoGuard Control Panel</p>
            </div>
          </div>
          <a href="/dashboard" className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Back to App
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Nav */}
        <div className="flex gap-2 mb-8 bg-white/70 backdrop-blur-xl rounded-2xl p-2 border border-violet-100 shadow-sm w-fit">
          {(["overview", "users", "tokens", "scan"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md" : "text-gray-500 hover:text-violet-700 hover:bg-violet-50"}`}>
              {t === "overview" ? "📊 Overview" : t === "users" ? "👥 Users" : t === "tokens" ? "🔍 Tokens" : "⚡ Scanner"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Tokens", value: stats?.totalTokens ?? "—", icon: "🔍", color: "from-violet-500 to-purple-600" },
                { label: "Safe Tokens", value: stats?.safeTokens ?? "—", icon: "✅", color: "from-emerald-500 to-teal-600" },
                { label: "Risky Tokens", value: stats?.riskyTokens ?? "—", icon: "⚠️", color: "from-red-500 to-rose-600" },
                { label: "Wallets Flagged", value: stats?.totalWallets ?? "—", icon: "🚫", color: "from-orange-500 to-amber-600" },
                { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥", color: "from-blue-500 to-indigo-600" },
              ].map(s => (
                <div key={s.label} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-br ${s.color} p-4`}>
                    <div className="text-3xl mb-1">{s.icon}</div>
                    <div className="text-white text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-gray-500 text-xs font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {stats?.bySource && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-sm">📡</span>
                  Tokens by Source
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(stats.bySource).map(([source, count]) => (
                    <div key={source} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-100">
                      <div className="text-violet-700 font-bold text-lg">{(count as number).toLocaleString()}</div>
                      <div className="text-gray-500 text-xs mt-0.5 capitalize">{source.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button onClick={fetchStats} className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                🔄 Refresh Stats
              </button>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-violet-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">All Users</h3>
              <button onClick={fetchUsers} className="text-violet-600 hover:text-violet-800 text-sm font-medium">🔄 Refresh</button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-violet-50">
                    <tr>
                      {["ID", "Email", "Plan", "Role", "Created", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-violet-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">#{u.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{u.email}</td>
                        <td className="px-4 py-3"><span className={planBadge(u.plan)}>{u.plan}</span></td>
                        <td className="px-4 py-3"><span className={roleBadge(u.role)}>{u.role}</span></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setEditUser({ id: u.id, plan: u.plan, role: u.role })}
                            className="text-violet-600 hover:text-violet-800 text-xs font-semibold">
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Modal */}
            {editUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-violet-100">
                  <h4 className="font-bold text-gray-800 mb-4">Edit User #{editUser.id}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Plan</label>
                      <select value={editUser.plan} onChange={e => setEditUser({ ...editUser, plan: e.target.value })}
                        className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Role</label>
                      <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                        className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={saveUserEdit} className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl text-sm font-semibold shadow-md">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TOKENS TAB */}
        {tab === "tokens" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-violet-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">All Tokens (Latest 50)</h3>
              <button onClick={fetchTokens} className="text-violet-600 hover:text-violet-800 text-sm font-medium">🔄 Refresh</button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading tokens...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-violet-50">
                    <tr>
                      {["Name", "Address", "Status", "Source", "Date", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tokens.map(t => (
                      <tr key={t.id} className="hover:bg-violet-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{t.name || t.symbol || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{t.address?.slice(0, 8)}...{t.address?.slice(-4)}</td>
                        <td className="px-4 py-3"><span className={statusBadge(t.status)}>{t.status}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs capitalize">{(t.source || "dexscreener").replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteToken(t.id)} className="text-red-400 hover:text-red-600 text-xs font-semibold">🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SCANNER TAB */}
        {tab === "scan" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">
                ⚡
              </div>
              <h3 className="font-bold text-gray-800 text-xl mb-2">Manual Scanner Trigger</h3>
              <p className="text-gray-500 text-sm mb-8">Trigger a full scan of Pump.fun, Axiom, and DexScreener for new tokens and performing assets.</p>
              <button onClick={triggerScan}
                className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0">
                🚀 Run Scanner Now
              </button>
              {scanMsg && (
                <div className="mt-6 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-violet-700 text-sm font-medium">
                  {scanMsg}
                </div>
              )}
              <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-gray-500">
                {["Pump.fun New", "Axiom Trending", "DexScreener"].map(s => (
                  <div key={s} className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                    <div className="text-lg mb-1">📡</div>
                    <div className="font-medium">{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
