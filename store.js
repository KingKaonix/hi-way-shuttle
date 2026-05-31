const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

let bookings = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadBookings() {
  try {
    ensureDataDir();
    if (fs.existsSync(BOOKINGS_FILE)) {
      bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
      console.log(`Loaded ${bookings.length} persisted bookings`);
    }
  } catch (err) {
    console.error('Failed to load bookings:', err.message);
    bookings = [];
  }
}

function saveBookings() {
  try {
    ensureDataDir();
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (err) {
    console.error('Failed to save bookings:', err.message);
  }
}

function getBookings() {
  return bookings;
}

function addBooking(booking) {
  bookings.push(booking);
  saveBookings();
  return booking;
}

function cancelBooking(bookingId) {
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return null;
  bookings[idx].status = 'canceled';
  saveBookings();
  return bookings[idx];
}

module.exports = { loadBookings, saveBookings, getBookings, addBooking, cancelBooking };
