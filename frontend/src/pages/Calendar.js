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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
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
      setEvents(response.data.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

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

  // Helper function to format date for datetime-local input
  const formatDateForInput = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dateTime') {
      const newDateTime = new Date(value);
      console.log('Selected dateTime:', value, 'Parsed dateTime:', newDateTime);
      setFormData({ ...formData, dateTime: newDateTime });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Submitting event with dateTime:', formData.dateTime);
      await axios.post('http://localhost:3000/api/events', formData, {
        withCredentials: true,
      });
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
      setError('Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Updating event with dateTime:', formData.dateTime);
      await axios.put(`http://localhost:3000/api/events/${selectedEvent._id}`, formData, {
        withCredentials: true,
      });
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
      setError('Failed to update event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`http://localhost:3000/api/events/${selectedEvent._id}`, {
        withCredentials: true,
      });
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calendar rendering logic
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = events.filter(
        (event) =>
          new Date(event.dateTime).toDateString() === date.toDateString()
      );
      days.push(
        <div
          key={day}
          className={`calendar-day ${dayEvents.length > 0 ? 'has-events' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span>{day}</span>
          {dayEvents.length > 0 && (
            <div className="event-indicator">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`event-dot ${event.eventType.toLowerCase()}`}
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
        (event) =>
          new Date(event.dateTime).toDateString() === date.toDateString()
      );
      days.push(
        <div
          key={i}
          className={`calendar-day ${dayEvents.length > 0 ? 'has-events' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span>{date.getDate()}</span>
          {dayEvents.length > 0 && (
            <div className="event-indicator">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`event-dot ${event.eventType.toLowerCase()}`}
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
      <div className="day-view">
        <h3>{date.toDateString()}</h3>
        {dayEvents.length > 0 ? (
          <ul>
            {dayEvents.map((event, idx) => (
              <li key={idx} onClick={() => handleEventClick(event)}>
                {new Date(event.dateTime).toLocaleTimeString()} - {event.eventName} ({event.eventType})
              </li>
            ))}
          </ul>
        ) : (
          <p>No events for this day.</p>
        )}
        <button onClick={() => handleDateClick(date)}>Add Event</button>
      </div>
    );
  };

  const filteredEvents = filter === 'All' ? events : events.filter((event) => event.eventType === filter);

  return (
    <div className="calendar-page">
      <h2>Calendar & Events</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={handlePrev}>Previous</button>
          <h3>
            {view === 'month' && currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            {view === 'week' &&
              `${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toDateString()} - ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6).toDateString()}`}
            {view === 'day' && currentDate.toDateString()}
          </h3>
          <button onClick={handleNext}>Next</button>
        </div>
        <div className="view-switcher">
          <button onClick={() => handleViewChange('month')} className={view === 'month' ? 'active' : ''}>
            Month
          </button>
          <button onClick={() => handleViewChange('week')} className={view === 'week' ? 'active' : ''}>
            Week
          </button>
          <button onClick={() => handleViewChange('day')} className={view === 'day' ? 'active' : ''}>
            Day
          </button>
        </div>
        {loading ? (
          <p>Loading events...</p>
        ) : (
          <div className="calendar-view">
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
                <div className="calendar-grid week-view">{renderWeekView()}</div>
              </>
            )}
            {view === 'day' && renderDayView()}
          </div>
        )}
      </div>

      {/* Event List */}
      <div className="event-list">
        <h3>Upcoming Events</h3>
        <div className="event-filter">
          <label>Filter by Type: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Subscription Billing">Subscription Billing</option>
          </select>
        </div>
        {filteredEvents.length > 0 ? (
          <ul>
            {filteredEvents.map((event, idx) => (
              <li key={idx} onClick={() => handleEventClick(event)}>
                {new Date(event.dateTime).toLocaleTimeString()} - {event.eventName} ({event.eventType})
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming events.</p>
        )}
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3>Add Event</h3>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label>Event Name:</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Date & Time:</label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formatDateForInput(formData.dateTime)}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Event Type:</label>
            <select name="eventType" value={formData.eventType} onChange={handleInputChange} required>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Subscription Billing" disabled>
                Subscription Billing (Auto-generated)
              </option>
            </select>
          </div>
          <div className="form-group">
            <label>Recurring:</label>
            <select name="recurring" value={formData.recurring} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notification Reminder:</label>
            <select name="notificationReminder" value={formData.notificationReminder} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="5 Minutes Before">5 Minutes Before</option>
              <option value="1 Hour Before">1 Hour Before</option>
              <option value="1 Day Before">1 Day Before</option>
              <option value="1 Week Before">1 Week Before</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes:</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange}></textarea>
          </div>
          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3>Edit Event</h3>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label>Event Name:</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Date & Time:</label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formatDateForInput(formData.dateTime)}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Event Type:</label>
            <select name="eventType" value={formData.eventType} onChange={handleInputChange} required>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Subscription Billing" disabled>
                Subscription Billing (Auto-generated)
              </option>
            </select>
          </div>
          <div className="form-group">
            <label>Recurring:</label>
            <select name="recurring" value={formData.recurring} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notification Reminder:</label>
            <select name="notificationReminder" value={formData.notificationReminder} onChange={handleInputChange}>
              <option value="None">None</option>
              <option value="5 Minutes Before">5 Minutes Before</option>
              <option value="1 Hour Before">1 Hour Before</option>
              <option value="1 Day Before">1 Day Before</option>
              <option value="1 Week Before">1 Week Before</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes:</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange}></textarea>
          </div>
          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading}>
              Delete
            </button>
            <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Calendar;