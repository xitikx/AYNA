// Diary.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Diary.css';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [filterMood, filterDate]);

  const fetchEntries = async () => {
    try {
      let url = 'http://localhost:3000/api/diary';
      const params = new URLSearchParams();
      if (filterMood) params.append('mood', filterMood);
      if (filterDate) params.append('date', filterDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, { withCredentials: true });
      setEntries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      setMessage('Failed to load diary entries.');
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage('Title and content are required.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3000/api/diary',
        { title, content, mood: mood || null },
        { withCredentials: true }
      );
      setMessage('Diary entry added successfully!');
      setTitle('');
      setContent('');
      setMood('');
      fetchEntries();
    } catch (error) {
      setMessage('Failed to add diary entry.');
    }
  };

  const handleEditEntry = (entry) => {
    setEditingId(entry._id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood || '');
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      setMessage('Title and content are required.');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/diary/${editingId}`,
        { title: editTitle, content: editContent, mood: editMood || null },
        { withCredentials: true }
      );
      setMessage('Diary entry updated successfully!');
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
      setEditMood('');
      fetchEntries();
    } catch (error) {
      setMessage('Failed to update diary entry.');
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/diary/${id}`, { withCredentials: true });
      setMessage('Diary entry deleted successfully!');
      fetchEntries();
    } catch (error) {
      setMessage('Failed to delete diary entry.');
    }
  };

  const clearFilters = () => {
    setFilterMood('');
    setFilterDate('');
  };

  const getMoodForDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    const entry = entries.find((e) => new Date(e.createdAt).toISOString().split('T')[0] === dayStr);
    return entry ? entry.mood : null;
  };

  const renderMoodGrid = () => {
    const days = 30;
    const today = new Date();
    const grid = [];
    const moodColors = {
      happy: '#2ecc71',
      sad: '#3498db',
      neutral: '#95a5a6',
      excited: '#f39c12',
      angry: '#e74c3c',
      null: '#ecf0f1',
    };

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const mood = getMoodForDay(day);
      const dayStr = day.toISOString().split('T')[0];
      const dayLabel = day.getDate() === 1 || i === 0 ? day.toLocaleString('default', { month: 'short', day: 'numeric' }) : day.getDate();

      grid.push(
        <div key={dayStr} className="mood-square" style={{ backgroundColor: moodColors[mood || 'null'] }} title={`${dayStr}: ${mood || 'No entry'}`}>
          <span className="day-label">{dayLabel}</span>
        </div>
      );
    }

    return grid;
  };

  return (
    <div className="diary-container">
      <div className="diary-gradient"></div>
      <header className="diary-header">
        <h1>Diary</h1>
      </header>
      <main className="diary-main">
        <section className="diary-form-section">
          <h3>Add New Entry</h3>
          <form onSubmit={handleAddEntry} className="diary-form">
            <div className="diary-form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., A Great Day"
              />
            </div>
            <div className="diary-form-group">
              <label htmlFor="content">Content:</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your day..."
                rows="4"
              />
            </div>
            <div className="diary-form-group">
              <label htmlFor="mood">Mood:</label>
              <select id="mood" value={mood} onChange={(e) => setMood(e.target.value)}>
                <option value="">None</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="neutral">Neutral</option>
                <option value="excited">Excited</option>
                <option value="angry">Angry</option>
              </select>
            </div>
            <button type="submit" className="diary-add-btn">Add Entry</button>
          </form>
        </section>
        <section className="diary-filter-section">
          <h3>Filter Entries</h3>
          <div className="diary-filter-controls">
            <div className="diary-form-group">
              <label htmlFor="filterMood">Mood:</label>
              <select id="filterMood" value={filterMood} onChange={(e) => setFilterMood(e.target.value)}>
                <option value="">All</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="neutral">Neutral</option>
                <option value="excited">Excited</option>
                <option value="angry">Angry</option>
              </select>
            </div>
            <div className="diary-form-group">
              <label htmlFor="filterDate">Date:</label>
              <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <button className="diary-clear-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        </section>
        <section className="diary-mood-section">
          <h3>Mood Tracker (Last 30 Days)</h3>
          <div className="mood-legend">
            <span className="legend-item"><span className="legend-square happy"></span> Happy</span>
            <span className="legend-item"><span className="legend-square sad"></span> Sad</span>
            <span className="legend-item"><span className="legend-square neutral"></span> Neutral</span>
            <span className="legend-item"><span className="legend-square excited"></span> Excited</span>
            <span className="legend-item"><span className="legend-square angry"></span> Angry</span>
            <span className="legend-item"><span className="legend-square no-entry"></span> No Entry</span>
          </div>
          <div className="mood-grid">
            {renderMoodGrid()}
          </div>
        </section>
        <section className="diary-list-section">
          <h3>Your Entries</h3>
          {entries.length > 0 ? (
            <div className="diary-entries">
              {entries.map((entry) => (
                <div key={entry._id} className="diary-entry">
                  {editingId === entry._id ? (
                    <form onSubmit={handleUpdateEntry} className="diary-edit-form">
                      <div className="diary-form-group">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Update title"
                        />
                      </div>
                      <div className="diary-form-group">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Update content"
                          rows="4"
                        />
                      </div>
                      <div className="diary-form-group">
                        <select value={editMood} onChange={(e) => setEditMood(e.target.value)}>
                          <option value="">None</option>
                          <option value="happy">Happy</option>
                          <option value="sad">Sad</option>
                          <option value="neutral">Neutral</option>
                          <option value="excited">Excited</option>
                          <option value="angry">Angry</option>
                        </select>
                      </div>
                      <button type="submit" className="diary-save-btn">Save</button>
                      <button type="button" className="diary-cancel-btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="diary-entry-details">
                      <h4>{entry.title} ({new Date(entry.createdAt).toISOString().split('T')[0]})</h4>
                      {entry.mood && (
                        <p className={`mood-label mood-${entry.mood}`}>
                          Mood: {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                        </p>
                      )}
                      <p>{entry.content}</p>
                      <div className="diary-entry-actions">
                        <button className="diary-edit-btn" onClick={() => handleEditEntry(entry)}>
                          Edit
                        </button>
                        <button className="diary-delete-btn" onClick={() => handleDeleteEntry(entry._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No entries found. Add a new entry to get started!</p>
          )}
        </section>
      </main>
      {message && <p className={`diary-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>}
    </div>
  );
};

export default Diary;