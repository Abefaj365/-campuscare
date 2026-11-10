import { useEffect, useState } from 'react'
import { api } from '../api.js'
import ComplaintCard from './ComplaintCard.jsx'

// Admin view: live stats + all complaints with a status filter.
export default function AdminDashboard({ user, token, onError }) {
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => { loadStats() }, [])
  useEffect(() => { load() }, [filter])

  async function loadStats() {
    try {
      const data = await api.stats(token)
      setStats(data.data)
    } catch {
      // Stats are admin-only; a 403 here means the token is not an admin.
    }
  }

  async function load() {
    try {
      const data = await api.allComplaints(token, filter)
      setComplaints(data.data || [])
    } catch (err) {
      onError(err.message)
    }
  }

  function refresh() {
    load()
    loadStats()
  }

  return (
    <>
      <div className="card">
        <h2>📊 Admin Stats</h2>
        <p className="sub">Live totals from <b>GET /api/complaints/stats</b> (admin only).</p>
        {stats && (
          <>
            <div className="row">
              <div className="stat"><b>{stats.total}</b><span>Total complaints</span></div>
              {stats.byStatus.map((s) => (
                <div className="stat" key={s.status}>
                  <b>{s.count}</b><span>{s.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              By category: {stats.byCategory.map((c) => `${c.category} (${c.count})`).join(', ')}
            </p>
          </>
        )}
      </div>

      <div className="card">
        <div className="topbar">
          <h2 style={{ margin: 0 }}>All Complaints (Admin)</h2>
          <button className="secondary small" onClick={refresh}>↻ Refresh</button>
        </div>
        <div className="filterbar">
          <label style={{ margin: 0 }}>Filter by status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          {complaints.length === 0 && <p className="muted">No complaints yet.</p>}
          {complaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              user={user}
              token={token}
              isAdmin={true}
              onChanged={refresh}
              onError={onError}
            />
          ))}
        </div>
      </div>
    </>
  )
}
