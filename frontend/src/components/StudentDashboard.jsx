import { useEffect, useState } from 'react'
import { api } from '../api.js'
import ComplaintCard from './ComplaintCard.jsx'

// Student view: new complaint form + my complaints list.
export default function StudentDashboard({ user, token, onError }) {
  const [complaints, setComplaints] = useState([])
  const [category, setCategory] = useState('WiFi')
  const [priority, setPriority] = useState('medium')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.myComplaints(token)
      setComplaints(data.data || [])
    } catch (err) {
      onError(err.message)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!location.trim() || !description.trim()) {
      onError('Please enter a location and a description.')
      return
    }
    setBusy(true)
    try {
      await api.createComplaint({ category, location, description, priority }, token)
      setInfo('Complaint submitted!')
      setLocation('')
      setDescription('')
      load()
    } catch (err) {
      onError(err.message)
    }
    setBusy(false)
  }

  return (
    <>
      <div className="card">
        <h2>✍️ New Complaint</h2>
        {info && <div className="msg ok">{info}</div>}
        <form onSubmit={submit}>
          <div className="row">
            <div>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>WiFi</option><option>Transportation</option><option>Electricity</option>
                <option>Hostel</option><option>Lab</option><option>Library</option><option>Other</option>
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <label>Location</label>
          <input placeholder="e.g. Lab 1, Hostel Block B" value={location}
            onChange={(e) => setLocation(e.target.value)} />
          <label>Description</label>
          <textarea placeholder="Describe the problem..." value={description}
            onChange={(e) => setDescription(e.target.value)} />
          <button disabled={busy}>{busy ? 'Please wait…' : 'Submit Complaint'}</button>
        </form>
      </div>

      <div className="card">
        <div className="topbar">
          <h2 style={{ margin: 0 }}>My Complaints</h2>
          <button className="secondary small" onClick={load}>↻ Refresh</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {complaints.length === 0 && <p className="muted">No complaints yet.</p>}
          {complaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              user={user}
              token={token}
              isAdmin={false}
              onChanged={load}
              onError={onError}
            />
          ))}
        </div>
      </div>
    </>
  )
}
