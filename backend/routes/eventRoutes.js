const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Subscription = require('../models/Subscription');
const { isAuthenticated } = require('../middleware/auth');

// Helper function to calculate recurring event occurrences
const getRecurringOccurrences = (event, startDate, endDate) => {
  const occurrences = [];
  const eventDate = new Date(event.dateTime);
  const end = new Date(endDate);

  if (event.recurring === 'None') {
    if (eventDate >= new Date(startDate) && eventDate <= end) {
      occurrences.push({ ...event._doc, dateTime: eventDate });
    }
    return occurrences;
  }

  let interval;
  switch (event.recurring) {
    case 'Daily':
      interval = 1;
      break;
    case 'Weekly':
      interval = 7;
      break;
    case 'Monthly':
      interval = 30; // Approximate
      break;
    case 'Yearly':
      interval = 365; // Approximate
      break;
    default:
      return occurrences;
  }

  let currentDate = new Date(eventDate);
  while (currentDate <= end) {
    if (currentDate >= new Date(startDate)) {
      occurrences.push({ ...event._doc, dateTime: new Date(currentDate) });
    }
    if (event.recurring === 'Monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (event.recurring === 'Yearly') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + interval);
    }
  }

  return occurrences;
};

// GET - Fetch all events within a date range (including recurring and subscription events)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const { startDate, endDate } = req.query; // e.g., ?startDate=2025-03-01&endDate=2025-03-31

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Fetch user-created events
    const events = await Event.find({
      userId,
      dateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Calculate recurring event occurrences
    let allEvents = [];
    for (const event of events) {
      const occurrences = getRecurringOccurrences(event, startDate, endDate);
      allEvents = allEvents.concat(occurrences);
    }

    // Fetch subscription billing events
    const subscriptions = await Subscription.find({
      userId,
      status: 'Active',
      nextBillingDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    const subscriptionEvents = subscriptions.map((sub) => ({
      eventName: `${sub.subscriptionName} Billing`,
      dateTime: new Date(sub.nextBillingDate),
      eventType: 'Subscription Billing',
      recurring: 'None',
      notificationReminder: '1 Day Before', // Default reminder for subscription billing
      notes: `Subscription renewal for ${sub.subscriptionName} - ₹${sub.price}`,
      subscriptionId: sub._id,
      userId: sub.userId,
    }));

    allEvents = allEvents.concat(subscriptionEvents);

    res.status(200).json({
      message: 'Events retrieved',
      data: allEvents,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// GET - Fetch upcoming events (within the next 7 days) for notifications
router.get('/upcoming', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Fetch user-created events
    const events = await Event.find({
      userId,
      dateTime: { $gte: today, $lte: sevenDaysFromNow },
    });

    // Calculate recurring event occurrences
    let upcomingEvents = [];
    for (const event of events) {
      const occurrences = getRecurringOccurrences(event, today, sevenDaysFromNow);
      upcomingEvents = upcomingEvents.concat(occurrences);
    }

    // Fetch subscription billing events
    const subscriptions = await Subscription.find({
      userId,
      status: 'Active',
      nextBillingDate: { $gte: today, $lte: sevenDaysFromNow },
    });

    const subscriptionEvents = subscriptions.map((sub) => ({
      eventName: `${sub.subscriptionName} Billing`,
      dateTime: new Date(sub.nextBillingDate),
      eventType: 'Subscription Billing',
      recurring: 'None',
      notificationReminder: '1 Day Before',
      notes: `Subscription renewal for ${sub.subscriptionName} - ₹${sub.price}`,
      subscriptionId: sub._id,
      userId: sub.userId,
    }));

    upcomingEvents = upcomingEvents.concat(subscriptionEvents);

    // Filter events with upcoming reminders
    const eventsWithReminders = upcomingEvents.filter((event) => {
      if (event.notificationReminder === 'None') return false;
      const eventDate = new Date(event.dateTime);
      let reminderTime;
      switch (event.notificationReminder) {
        case '5 Minutes Before':
          reminderTime = new Date(eventDate.getTime() - 5 * 60 * 1000);
          break;
        case '1 Hour Before':
          reminderTime = new Date(eventDate.getTime() - 60 * 60 * 1000);
          break;
        case '1 Day Before':
          reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '1 Week Before':
          reminderTime = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          return false;
      }
      const now = new Date();
      return now >= reminderTime && now <= eventDate;
    });

    res.status(200).json({
      message: 'Upcoming events retrieved',
      data: eventsWithReminders,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
  }
});

// POST - Create a new event
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const { eventName, dateTime, eventType, recurring, notificationReminder, notes } = req.body;

    if (!eventName || !dateTime || !eventType) {
      return res.status(400).json({ message: 'Event name, date, and type are required' });
    }

    const event = new Event({
      userId,
      eventName,
      dateTime,
      eventType,
      recurring: recurring || 'None',
      notificationReminder: notificationReminder || 'None',
      notes: notes || '',
    });

    await event.save();

    res.status(201).json({
      message: 'Event created',
      data: event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// PUT - Update an existing event
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const { id } = req.params;
    const { eventName, dateTime, eventType, recurring, notificationReminder, notes } = req.body;

    const event = await Event.findOne({ _id: id, userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.eventName = eventName || event.eventName;
    event.dateTime = dateTime || event.dateTime;
    event.eventType = eventType || event.eventType;
    event.recurring = recurring || event.recurring;
    event.notificationReminder = notificationReminder || event.notificationReminder;
    event.notes = notes || event.notes;

    await event.save();

    res.status(200).json({
      message: 'Event updated',
      data: event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// DELETE - Delete an event
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const { id } = req.params;

    const event = await Event.findOneAndDelete({ _id: id, userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      message: 'Event deleted',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

// GET - Fetch subscription billing events (for reference)
router.get('/subscriptions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const subscriptions = await Subscription.find({
      userId,
      status: 'Active',
      nextBillingDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    const subscriptionEvents = subscriptions.map((sub) => ({
      eventName: `${sub.subscriptionName} Billing`,
      dateTime: new Date(sub.nextBillingDate),
      eventType: 'Subscription Billing',
      recurring: 'None',
      notificationReminder: '1 Day Before',
      notes: `Subscription renewal for ${sub.subscriptionName} - ₹${sub.price}`,
      subscriptionId: sub._id,
      userId: sub.userId,
    }));

    res.status(200).json({
      message: 'Subscription billing events retrieved',
      data: subscriptionEvents,
    });
  } catch (error) {
    console.error('Error fetching subscription billing events:', error);
    res.status(500).json({ message: 'Error fetching subscription billing events', error: error.message });
  }
});

module.exports = router;