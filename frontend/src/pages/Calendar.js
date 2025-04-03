import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../styles/Calendar.css';

// Bind modal to the app element for accessibility
Modal.setAppElement('#root');

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    eventName: '',
    dateTime: new Date(),
    eventType: 'Personal',
    recurring: 'None',
    notificationReminder: 'None',
    notes: '',
  });
  const [filter, setFilter] = useState('All'); // Event type filter
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    setMessage('');
    try {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);

      if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      } else if (view === 'week') {
        const dayOfWeek = currentDate.getDay();
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
      } else if (view === 'day') {
        endDate.setDate(startDate.getDate());
      }

      const response = await axios.get('http://localhost:3000/api/events', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        withCredentials: true,
      });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage('Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => setView(newView);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFormData({ ...formData, dateTime: date });
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setFormData({
      eventName: event.eventName,
      dateTime: new Date(event.dateTime),
      eventType: event.eventType,
      recurring: event.recurring,
      notificationReminder: event.notificationReminder,
      notes: event.notes,
    });
    setIsEditModalOpen(true);
  };

  const formatDateForInput = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dateTime') setFormData({ ...formData, dateTime: new Date(value) });
    else setFormData({ ...formData, [name]: value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:3000/api/events', formData, { withCredentials: true });
      setMessage('Event added successfully!');
      setIsModalOpen(false);
      setFormData({
        eventName: '',
        dateTime: selectedDate || new Date(),
        eventType: 'Personal',
        recurring: 'None',
        notificationReminder: 'None',
        notes: '',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      setMessage('Failed to add event.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.put(`http://localhost:3000/api/events/${selectedEvent._id}`, formData, {
        withCredentials: true,
      });
      setMessage('Event updated successfully!');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      setFormData({
        eventName: '',
        dateTime: selectedDate || new Date(),
        eventType: 'Personal',
        recurring: 'None',
        notificationReminder: 'None',
        notes: '',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      setMessage('Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    setMessage('');
    try {
      await axios.delete(`http://localhost:3000/api/events/${selectedEvent._id}`, {
        withCredentials: true,
      });
      setMessage('Event deleted successfully!');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage('Failed to delete event.');
    } finally {
      setLoading(false);
    }
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = events.filter(
        (event) => new Date(event.dateTime).toDateString() === date.toDateString()
      );
      days.push(
        <div
          key={day}
          className={`calendar-day ${dayEvents.length > 0 ? 'calendar-day--has-events' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span>{day}</span>
          {dayEvents.length > 0 && (
            <div className="calendar-event-indicator">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`calendar-event-dot calendar-event-dot--${event.eventType.toLowerCase()}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = events.filter(
        (event) => new Date(event.dateTime).toDateString() === date.toDateString()
      );
      days.push(
        <div
          key={i}
          className={`calendar-day ${dayEvents.length > 0 ? 'calendar-day--has-events' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span>{date.getDate()}</span>
          {dayEvents.length > 0 && (
            <div className="calendar-event-indicator">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`calendar-event-dot calendar-event-dot--${event.eventType.toLowerCase()}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderDayView = () => {
    const date = new Date(currentDate);
    const dayEvents = events.filter(
      (event) => new Date(event.dateTime).toDateString() === date.toDateString()
    );
    return (
      <div className="calendar-day-view">
        <h3>{date.toDateString()}</h3>
        {dayEvents.length > 0 ? (
          <ul className="calendar-day-events">
            {dayEvents.map((event, idx) => (
              <li key={idx} onClick={() => handleEventClick(event)}>
                {new Date(event.dateTime).toLocaleTimeString()} - {event.eventName} ({event.eventType})
              </li>
            ))}
          </ul>
        ) : (
          <p>No events for this day.</p>
        )}
        <button className="calendar-add-btn" onClick={() => handleDateClick(date)}>
          Add Event
        </button>
      </div>
    );
  };

  const filteredEvents = filter === 'All' ? events : events.filter((event) => event.eventType === filter);

  return (
    <div className="calendar-container">
      <div className="calendar-gradient"></div>
      <header className="calendar-header">
        <h1>Calendar & Events</h1>
      </header>
      <main className="calendar-main">
        <section className="calendar-view-section">
          <div className="calendar-controls">
            <button className="calendar-nav-btn" onClick={handlePrev}>
              Previous
            </button>
            <h3>
              {view === 'month' && currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              {view === 'week' &&
                `${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toDateString()} - ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6).toDateString()}`}
              {view === 'day' && currentDate.toDateString()}
            </h3>
            <button className="calendar-nav-btn" onClick={handleNext}>
              Next
            </button>
          </div>
          <div className="calendar-view-switcher">
            <button
              onClick={() => handleViewChange('month')}
              className={`calendar-view-btn ${view === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`calendar-view-btn ${view === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('day')}
              className={`calendar-view-btn ${view === 'day' ? 'active' : ''}`}
            >
              Day
            </button>
          </div>
          {loading ? (
            <p>Loading events...</p>
          ) : (
            <div className="calendar-display">
              {view === 'month' && (
                <>
                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="calendar-grid">{renderMonthView()}</div>
                </>
              )}
              {view === 'week' && (
                <>
                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="calendar-grid calendar-grid--week">{renderWeekView()}</div>
                </>
              )}
              {view === 'day' && renderDayView()}
            </div>
          )}
        </section>

        <section className="calendar-event-list">
          <h3>Upcoming Events</h3>
          <div className="calendar-event-filter">
            <label>Filter by Type:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Subscription Billing">Subscription Billing</option>
            </select>
          </div>
          {filteredEvents.length > 0 ? (
            <ul className="calendar-event-items">
              {filteredEvents.map((event, idx) => {
                const eventDate = new Date(event.dateTime);
                const isPast = eventDate < new Date();
                return (
                  <li
                    key={idx}
                    className={`calendar-event-item calendar-event-item--${event.eventType.toLowerCase()} ${isPast ? 'calendar-event-item--past' : ''}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="calendar-event-time">
                      {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="calendar-event-details">
                      <span className="calendar-event-name">{event.eventName}</span>
                      <span className="calendar-event-type">({event.eventType})</span>
                      {event.recurring !== 'None' && (
                        <span className="calendar-event-recurring">🔄 {event.recurring}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="calendar-event-empty">No upcoming events.</p>
          )}
        </section>
      </main>

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="calendar-modal"
        overlayClassName="calendar-modal-overlay"
        contentLabel="Add Event"
      >
        <div className="calendar-modal-header">
          <h3>Add New Event</h3>
          <button className="calendar-modal-close" onClick={() => setIsModalOpen(false)}>
            ×
          </button>
        </div>
        <form onSubmit={handleAddSubmit} className="calendar-add-form">
          <div className="calendar-form-grid">
            <div className="calendar-form-field">
              <label htmlFor="eventName">Event Name</label>
              <input
                id="eventName"
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                placeholder="What’s happening?"
                required
              />
            </div>
            <div className="calendar-form-field">
              <label htmlFor="dateTime">Date & Time</label>
              <input
                id="dateTime"
                type="datetime-local"
                name="dateTime"
                value={formatDateForInput(formData.dateTime)}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="calendar-form-field">
              <label htmlFor="eventType">Event Type</label>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                required
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Subscription Billing" disabled>
                  Subscription Billing (Auto-generated)
                </option>
              </select>
            </div>
            <div className="calendar-form-field">
              <label htmlFor="recurring">Recurring</label>
              <select
                id="recurring"
                name="recurring"
                value={formData.recurring}
                onChange={handleInputChange}
              >
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div className="calendar-form-field">
              <label htmlFor="notificationReminder">Reminder</label>
              <select
                id="notificationReminder"
                name="notificationReminder"
                value={formData.notificationReminder}
                onChange={handleInputChange}
              >
                <option value="None">None</option>
                <option value="5 Minutes Before">5 Minutes Before</option>
                <option value="1 Hour Before">1 Hour Before</option>
                <option value="1 Day Before">1 Day Before</option>
                <option value="1 Week Before">1 Week Before</option>
              </select>
            </div>
            <div className="calendar-form-field calendar-form-field--full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional details?"
              />
            </div>
          </div>
          <div className="calendar-modal-actions">
            <button type="submit" className="calendar-add-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Event'}
            </button>
            <button
              type="button"
              className="calendar-cancel-btn"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        className="calendar-modal"
        overlayClassName="calendar-modal-overlay"
      >
        <h3>Edit Event</h3>
        <form onSubmit={handleEditSubmit} className="calendar-form">
          <div className="calendar-form-group">
            <label>Event Name:</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="calendar-form-group">
            <label>Date & Time:</label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formatDateForInput(formData.dateTime)}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="calendar-form-group">
            <label>Event Type:</label>
            <select name="eventType" value={formData.eventType} onChange={handleInputChange} required>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Subscription Billing" disabled>
                Subscription Billing (Auto-generated)
              </option>
            </select>
          </div>
          <div className="calendar-form-group">
            <label>Recurring:</label>
            <select name="recurring" value={formData.recurring} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className="calendar-form-group">
            <label>Notification Reminder:</label>
            <select name="notificationReminder" value={formData.notificationReminder} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="5 Minutes Before">5 Minutes Before</option>
              <option value="1 Hour Before">1 Hour Before</option>
              <option value="1 Day Before">1 Day Before</option>
              <option value="1 Week Before">1 Week Before</option>
            </select>
          </div>
          <div className="calendar-form-group">
            <label>Notes:</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange}></textarea>
          </div>
          <div className="calendar-modal-buttons">
            <button type="submit" className="calendar-update-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button type="button" className="calendar-delete-btn" onClick={handleDelete} disabled={loading}>
              Delete
            </button>
            <button
              type="button"
              className="calendar-cancel-btn"
              onClick={() => setIsEditModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      {message && (
        <p className={`calendar-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>
      )}
    </div>
  );
};

export default Calendar;