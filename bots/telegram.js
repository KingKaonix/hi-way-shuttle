const axios = require('axios');
const path = require('path');
const fs = require('fs');

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'routes.json'), 'utf8'));
const fares = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'fares.json'), 'utf8'));
const schedules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'schedules.json'), 'utf8'));

function createTelegramBot(botToken, getBookings, addBooking, cancelBooking, bookingIdRef) {
  async function sendMessage(chatId, text, extra = {}) {
    if (!botToken) return;
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...extra
    });
  }

  async function handleUpdate(update, miniAppUrlFallback) {
    try {
      if (update.message) {
        await handleMessage(update.message, miniAppUrlFallback);
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      }
    } catch (err) {
      console.error('Telegram handleUpdate error:', err.message);
    }
  }

  async function handleMessage(message, miniAppUrlFallback) {
    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    if (text === '/start') {
      await sendMessage(chatId,
        '🚐 *Welcome to Hi-Way-Shuttle!*\n\n' +
        'I can help you book rides and check schedules.\n\n' +
        'Commands:\n' +
        '/routes - View all routes\n' +
        '/schedule - View schedule for a route\n' +
        '/fare - Check fares\n' +
        '/mybookings - View your bookings\n' +
        '/book - Book a ride\n' +
        '/cancel <id> - Cancel a booking\n' +
        '/help - Show this message\n\n' +
        'Or open the Mini App to book: 👇',
        {
          reply_markup: {
            inline_keyboard: [[{
              text: 'Open Mini App',
              web_app: { url: process.env.MINI_APP_URL || miniAppUrlFallback }
            }]]
          }
        }
      );
    } else if (text === '/routes') {
      const list = routes.map((r, i) =>
        `${i + 1}. *${r.name}* — ${r.description}\n   Stops: ${r.stops.join(' → ')}`
      ).join('\n\n');
      await sendMessage(chatId, `*Available Routes*\n\n${list}`);
    } else if (text.startsWith('/schedule')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        const buttons = routes.map(r => [{ text: r.name, callback_data: `schedule_${r.id}` }]);
        await sendMessage(chatId, 'Select a route:', {
          reply_markup: { inline_keyboard: buttons }
        });
      } else {
        const routeId = parts[1];
        const route = routes.find(r => r.id === routeId);
        if (!route) return await sendMessage(chatId, 'Route not found.');
        const sched = schedules[routeId];
        if (!sched) return await sendMessage(chatId, 'No schedule found.');
        const times = sched.map(s => `${s.departure} → ${s.arrival}`).join('\n');
        await sendMessage(chatId, `*${route.name} Schedule*\n\n${times}`);
      }
    } else if (text === '/book') {
      const buttons = routes.map(r => [{ text: r.name, callback_data: `book_${r.id}` }]);
      await sendMessage(chatId, 'Select a route to book:', {
        reply_markup: { inline_keyboard: buttons }
      });
    } else if (text.startsWith('/cancel')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        await sendMessage(chatId, 'Usage: /cancel <booking_id>\n\nUse /mybookings to see your booking IDs.');
      } else {
        const bookingId = parseInt(parts[1], 10);
        if (isNaN(bookingId)) {
          return await sendMessage(chatId, 'Invalid booking ID. Please use the number (e.g., /cancel 5).');
        }
        const booking = cancelBooking(bookingId);
        if (!booking) {
          return await sendMessage(chatId, `Booking #${bookingId} not found.`);
        }
        if (String(booking.chatId) !== String(chatId)) {
          return await sendMessage(chatId, `Booking #${bookingId} does not belong to you.`);
        }
        await sendMessage(chatId,
          `❌ *Booking Canceled*\n\n` +
          `Route: ${booking.route}\n` +
          `Departure: ${booking.departure}\n` +
          `Arrival: ${booking.arrival}\n` +
          `Booking ID: #${booking.id}\n\n` +
          `Your booking has been canceled.`
        );
      }
    } else if (text === '/mybookings') {
      const userBookings = getBookings().filter(b => String(b.chatId) === String(chatId));
      if (userBookings.length === 0) {
        return await sendMessage(chatId, 'You have no bookings yet. Use /book to make one!');
      }
      const lines = userBookings.map(b =>
        `#${b.id} — ${b.route} — ${b.departure} → ${b.arrival} — *${b.status}*`
      ).join('\n');
      await sendMessage(chatId, `*Your Bookings*\n\n${lines}\n\nUse /cancel <id> to cancel a booking.`);
    } else if (text === '/help') {
      await sendMessage(chatId,
        '*Hi-Way-Shuttle Commands*\n\n' +
        '/routes - View all routes\n' +
        '/schedule [route_id] - View schedule\n' +
        '/fare [route_id] - Check fare\n' +
        '/book - Book a ride\n' +
        '/mybookings - View your bookings\n' +
        '/cancel <id> - Cancel a booking\n' +
        '/help - This message'
      );
    } else if (text.startsWith('/fare')) {
      const parts = text.split(' ');
      const routeId = parts[1];
      if (routeId) {
        const route = routes.find(r => r.id === routeId);
        const f = fares.routes[routeId];
        if (!route || !f) return await sendMessage(chatId, 'Route not found.');
        await sendMessage(chatId, `*${route.name} Fare*\nFlat fare: ${fares.currency} ${f.flat_fare.toFixed(2)}`);
      } else {
        const lines = routes.map(r => {
          const f = fares.routes[r.id];
          return `• ${r.name}: ${fares.currency} ${f.flat_fare.toFixed(2)}`;
        }).join('\n');
        await sendMessage(chatId, `*Fares*\nBase fare: ${fares.currency} ${fares.base_fare.toFixed(2)}\n\n${lines}`);
      }
    }
  }

  async function handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    await axios.post(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      callback_query_id: callbackQuery.id
    });

    if (data.startsWith('schedule_')) {
      const routeId = data.replace('schedule_', '');
      const route = routes.find(r => r.id === routeId);
      if (!route || !schedules[routeId]) {
        return await sendMessage(chatId, 'Route not found.');
      }
      const times = schedules[routeId].map(s => `${s.departure} → ${s.arrival}`).join('\n');
      await axios.post(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text: `*${route.name} Schedule*\n\n${times}`,
        parse_mode: 'Markdown'
      });
    } else if (data.startsWith('book_')) {
      const routeId = data.replace('book_', '');
      const route = routes.find(r => r.id === routeId);
      if (!route || !schedules[routeId]) {
        return await sendMessage(chatId, 'Route not found.');
      }
      const sched = schedules[routeId];
      const slots = sched.map((s, i) => `${i + 1}. ${s.departure} → ${s.arrival}`).join('\n');
      await axios.post(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text: `*${route.name}* — Select departure time:\n\n${slots}\n\nReply with the number (e.g., "1") to confirm.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: sched.slice(0, 8).map((s, i) => [
            { text: `${s.departure} → ${s.arrival}`, callback_data: `confirm_${routeId}_${i}` }
          ])
        }
      });
    } else if (data.startsWith('confirm_')) {
      const parts = data.split('_');
      const routeId = parts[1];
      const slotIdx = parseInt(parts[2], 10);
      const route = routes.find(r => r.id === routeId);
      const sched = schedules[routeId];
      if (!route || !sched || !sched[slotIdx]) {
        return await sendMessage(chatId, 'Invalid selection.');
      }
      const slot = sched[slotIdx];
      const booking = addBooking({
        id: bookingIdRef.value++,
        route: route.name,
        departure: slot.departure,
        arrival: slot.arrival,
        chatId: String(chatId),
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      await axios.post(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text: `✅ *Booking Confirmed!*\n\nRoute: ${route.name}\nDeparture: ${slot.departure}\nArrival: ${slot.arrival}\nBooking ID: #${booking.id}\nFare: ${fares.currency} ${fares.routes[routeId].flat_fare.toFixed(2)}\n\nThank you for choosing Hi-Way-Shuttle!`,
        parse_mode: 'Markdown'
      });
    }
  }

  return { handleUpdate };
}

module.exports = { createTelegramBot };
