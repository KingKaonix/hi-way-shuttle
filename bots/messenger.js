const axios = require('axios');
const path = require('path');
const fs = require('fs');

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'routes.json'), 'utf8'));
const fares = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'fares.json'), 'utf8'));
const schedules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'schedules.json'), 'utf8'));

function createMessengerBot(pageToken, getBookings, addBooking, cancelBooking, bookingIdRef) {
  async function sendMessage(senderId, message) {
    if (!pageToken) return;
    try {
      if (message.text && message.quick_replies) {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`, {
          recipient: { id: senderId },
          messaging_type: 'RESPONSE',
          message: {
            text: message.text,
            quick_replies: message.quick_replies.map(q => ({
              content_type: 'text',
              title: q.title,
              payload: q.payload
            }))
          }
        });
      } else {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`, {
          recipient: { id: senderId },
          messaging_type: 'RESPONSE',
          message: { text: message.text }
        });
      }
    } catch (err) {
      console.error('Messenger sendMessage error:', err.message);
    }
  }

  async function handleMessage(senderId, text) {
    const lower = text.toLowerCase();

    if (lower === '/start' || lower === 'hi' || lower === 'hello') {
      await sendMessage(senderId, {
        text: '🚐 Welcome to Hi-Way-Shuttle!\n\nCommands:\n- routes — View all routes\n- schedule [name] — View schedule\n- fare [name] — Check fare\n- book — Book a ride\n- mybookings — View your bookings\n- cancel <id> — Cancel a booking\n- help — Show this message'
      });
    } else if (lower === 'routes') {
      const list = routes.map((r, i) => `${i + 1}. ${r.name} — ${r.stops.join(' → ')}`).join('\n\n');
      await sendMessage(senderId, {
        text: `Available Routes:\n\n${list}\n\nType "schedule [route name]" to see times.`
      });
    } else if (lower === 'book') {
      const buttons = routes.map(r => ({
        type: 'postback', title: r.name, payload: `book_${r.id}`
      }));
      await sendMessage(senderId, {
        text: 'Select a route to book:',
        quick_replies: buttons
      });
    } else if (lower.startsWith('cancel')) {
      const parts = lower.split(' ');
      if (parts.length < 2) {
        return await sendMessage(senderId, { text: 'Usage: cancel <booking_id>\n\nType "mybookings" to see your booking IDs.' });
      }
      const bookingId = parseInt(parts[1], 10);
      if (isNaN(bookingId)) {
        return await sendMessage(senderId, { text: 'Invalid booking ID. Please use the number (e.g., cancel 5).' });
      }
      const booking = cancelBooking(bookingId);
      if (!booking) {
        return await sendMessage(senderId, { text: `Booking #${bookingId} not found.` });
      }
      if (booking.messengerId !== senderId) {
        return await sendMessage(senderId, { text: `Booking #${bookingId} does not belong to you.` });
      }
      await sendMessage(senderId, {
        text: `❌ Booking Canceled\n\nRoute: ${booking.route}\nDeparture: ${booking.departure}\nArrival: ${booking.arrival}\nBooking ID: #${booking.id}\n\nYour booking has been canceled.`
      });
    } else if (lower === 'mybookings') {
      const userBookings = getBookings().filter(b => b.messengerId === senderId);
      if (userBookings.length === 0) {
        return await sendMessage(senderId, { text: 'You have no bookings yet. Type "book" to make one!' });
      }
      const lines = userBookings.map(b =>
        `#${b.id} — ${b.route} — ${b.departure} → ${b.arrival} — ${b.status}`
      ).join('\n');
      await sendMessage(senderId, { text: `Your Bookings:\n\n${lines}\n\nType "cancel <id>" to cancel a booking.` });
    } else if (lower.startsWith('schedule')) {
      const query = text.slice(8).trim().toLowerCase();
      let route = routes.find(r => r.id.toLowerCase() === query) || routes.find(r => r.name.toLowerCase() === query);
      if (!route) route = routes.find(r => r.name.toLowerCase().startsWith(query));
      if (!route) route = routes.find(r => r.name.toLowerCase().includes(query));
      if (!route) return await sendMessage(senderId, { text: 'Route not found. Type "routes" to see options.' });
      const sched = schedules[route.id];
      if (!sched) return await sendMessage(senderId, { text: 'No schedule found.' });
      const times = sched.map(s => `${s.departure} → ${s.arrival}`).join('\n');
      await sendMessage(senderId, { text: `${route.name} Schedule:\n\n${times}` });
    } else if (lower === 'help') {
      await sendMessage(senderId, {
        text: 'Commands:\n- routes: View all routes\n- schedule [name]: View schedule\n- fare [name]: Check fare\n- book: Book a ride\n- mybookings: View your bookings\n- cancel <id>: Cancel a booking'
      });
    } else if (lower.startsWith('fare')) {
      const query = text.slice(4).trim().toLowerCase();
      if (query) {
        let route = routes.find(r => r.id.toLowerCase() === query) || routes.find(r => r.name.toLowerCase() === query);
        if (!route) route = routes.find(r => r.name.toLowerCase().startsWith(query));
        if (!route) route = routes.find(r => r.name.toLowerCase().includes(query));
        const f = route ? fares.routes[route.id] : null;
        if (!route || !f) return await sendMessage(senderId, { text: 'Route not found.' });
        await sendMessage(senderId, { text: `${route.name} Fare: ${fares.currency} ${f.flat_fare.toFixed(2)}` });
      } else {
        const lines = routes.map(r => `• ${r.name}: ${fares.currency} ${fares.routes[r.id].flat_fare.toFixed(2)}`).join('\n');
        await sendMessage(senderId, { text: `Fares:\nBase fare: ${fares.currency} ${fares.base_fare.toFixed(2)}\n\n${lines}` });
      }
    } else {
      await sendMessage(senderId, { text: 'Type "help" to see available commands.' });
    }
  }

  async function handlePostback(senderId, payload) {
    if (payload.startsWith('book_')) {
      const routeId = payload.replace('book_', '');
      const route = routes.find(r => r.id === routeId);
      if (!route) return await sendMessage(senderId, { text: 'Route not found.' });
      const sched = schedules[routeId];
      if (!sched) return await sendMessage(senderId, { text: 'No schedule.' });
      const lines = sched.map((s, i) => `${i + 1}. ${s.departure} → ${s.arrival}`).join('\n');
      await sendMessage(senderId, {
        text: `${route.name} — Select departure time:\n${lines.join('\n')}\n\nReply with the number (e.g., "1") to confirm.`,
        quick_replies: sched.slice(0, 6).map((s, i) => ({
          type: 'postback', title: s.departure, payload: `confirm_${routeId}_${i}`
        }))
      });
    } else if (payload.startsWith('confirm_')) {
      const parts = payload.split('_');
      const routeId = parts[1];
      const slotIdx = parseInt(parts[2], 10);
      const route = routes.find(r => r.id === routeId);
      const sched = schedules[routeId];
      if (!route || !sched || !sched[slotIdx]) return await sendMessage(senderId, { text: 'Invalid selection.' });
      const slot = sched[slotIdx];
      const booking = addBooking({
        id: bookingIdRef.value++,
        route: route.name,
        departure: slot.departure,
        arrival: slot.arrival,
        messengerId: senderId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      const fare_info = fares.routes[routeId];
      await sendMessage(senderId, {
        text: `✅ Booking Confirmed!\n\nRoute: ${route.name}\nDeparture: ${slot.departure}\nArrival: ${slot.arrival}\nFare: ${fares.currency} ${fare_info ? fare_info.flat_fare.toFixed(2) : 'N/A'}\nBooking ID: #${booking.id}\n\nThank you for choosing Hi-Way-Shuttle!`
      });
    }
  }

  return { handleMessage, handlePostback };
}

module.exports = { createMessengerBot };
