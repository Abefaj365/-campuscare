import { useEffect, useState } from 'react'
import { api } from '../api.js'

// One complaint: details, status badge, comments, rating,
// and (for admins) a status-change dropdown.
export default function ComplaintCard({ complaint, user, token, isAdmin, onChanged, onError }) {
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [rating, setRating] = useState(null)
  const [rateValue, setRateValue] = useState('5')
  const [rateFeedback, setRateFeedback] = useState('')

  useEffect(() => {
    loadComments()
    loadRating()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint.id])

  async function loadComments() {
    try {
      const data = await api.getComments(complaint.id, token)
      setComments(data.data || [])
    } catch {
      // Not the owner/admin — the backend hides these comments.
    }
  }

  async function loadRating() {
    try {
      const data = await api.getRating(complaint.id, token)
      setRating(data.data || null)
    } catch {
      setRating(null)
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return
    try {
      await api.addComment(complaint.id, commentText, token)
      setCommentText('')
      loadComments()
    } catch (err) {
      onError(err.message)
    }
  }

  async function submitRating() {
    try {
      await api.addRating(complaint.id, Number(rateValue), rateFeedback, token)
      setRateFeedback('')
      loadRating()
      onChanged()
    } catch (err) {
      onError(err.message)
    }
  }

  async function changeStatus(status) {
    if (!status) return
    try {
      await api.updateStatus(complaint.id, status, token)
      onChanged()
    } catch (err) {
      onError(err.message)
    }
  }

  const canRate =
    user.role === 'student' &&
    complaint.status === 'resolved' &&
    String(complaint.student_id) === String(user.id) &&
    !rating

  return (
    <div className="complaint">
      <h3>
        {complaint.category} — {complaint.location}{' '}
        <span className={`badge ${complaint.status}`}>{complaint.status.replace('_', ' ')}</span>
      </h3>
      <p>{complaint.description}</p>
      <p className="muted">
        Priority: {complaint.priority} | ID: {complaint.id}
        {complaint.student_name ? ` | Student: ${complaint.student_name}` : ''}
        {' | '}{new Date(complaint.created_at).toLocaleString()}
      </p>

      {isAdmin && (
        <select onChange={(e) => changeStatus(e.target.value)} defaultValue="">
          <option value="">Change status...</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      )}

      <div>
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <b>{c.commenter_name}</b> ({c.commenter_role}): {c.comment}
          </div>
        ))}
      </div>
      <div className="row">
        <input
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button className="small secondary" onClick={submitComment}>Comment</button>
      </div>

      {rating ? (
        <p className="muted">
          ⭐ Rating: {rating.rating}/5
          {rating.feedback ? ` — "${rating.feedback}"` : ''}
        </p>
      ) : canRate ? (
        <div>
          <div className="row">
            <select value={rateValue} onChange={(e) => setRateValue(e.target.value)} style={{ flex: '0 0 90px' }}>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
            <input
              placeholder="Feedback (optional)"
              value={rateFeedback}
              onChange={(e) => setRateFeedback(e.target.value)}
            />
            <button className="small" onClick={submitRating}>Rate</button>
          </div>
          <p className="muted">You can rate a resolved complaint only once.</p>
        </div>
      ) : null}
    </div>
  )
}
