import React, { useEffect, useState } from "react";

// Single-file React component simulating a restaurant table booking app.
// - Uses Tailwind CSS for styling (assumes Tailwind is available in your project)
// - Stores bookings in localStorage so data persists between reloads
// - Pages: Home, Booking, Confirmation, My Bookings, Admin
// - Simple in-memory table list with ability to add/remove tables in Admin

export default function BookingApp() {
  // --- App state ---
  const [page, setPage] = useState("home"); // home | booking | confirm | mybookings | admin
  const [selected, setSelected] = useState({ date: "", time: "19:00", guests: 2 });
  const [availableTables, setAvailableTables] = useState([]);
  const [lastBooking, setLastBooking] = useState(null);

  // Load tables and bookings from localStorage or use defaults
  const [tables, setTables] = useState(() => {
    const raw = localStorage.getItem("rtb_tables");
    if (raw) return JSON.parse(raw);
    // default tables
    return [
      { id: "T1", seats: 2, name: "Window 1" },
      { id: "T2", seats: 2, name: "Window 2" },
      { id: "T3", seats: 4, name: "Family 1" },
      { id: "T4", seats: 4, name: "Family 2" },
      { id: "T5", seats: 6, name: "Group 1" },
    ];
  });

  const [bookings, setBookings] = useState(() => {
    const raw = localStorage.getItem("rtb_bookings");
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => localStorage.setItem("rtb_tables", JSON.stringify(tables)), [tables]);
  useEffect(() => localStorage.setItem("rtb_bookings", JSON.stringify(bookings)), [bookings]);

  // Helper: format date -> YYYY-MM-DD (keeps things simple)
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  // --- Booking flow ---
  function findAvailableTables({ date, time, guests }) {
    if (!date) return [];
    // A table is available if its seats >= guests and not already booked for same date+time
    const key = (b) => `${b.date} ${b.time} ${b.tableId}`;
    const bookedKeys = new Set(bookings.map((b) => key(b)));

    const matches = tables.filter(
      (t) => t.seats >= guests && !bookedKeys.has(`${date} ${time} ${t.id}`)
    );
    return matches;
  }

  function handleSearchAvail() {
    const avail = findAvailableTables(selected);
    setAvailableTables(avail);
    setPage("booking");
  }

  function makeBooking(tableId) {
    const id = `B_${Date.now()}`;
    const newBooking = {
      id,
      tableId,
      tableName: tables.find((t) => t.id === tableId)?.name || tableId,
      seats: tables.find((t) => t.id === tableId)?.seats || 0,
      date: selected.date,
      time: selected.time,
      guests: selected.guests,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    setBookings((s) => [newBooking, ...s]);
    setLastBooking(newBooking);
    setPage("confirm");
  }

  function cancelBooking(id) {
    setBookings((s) => s.filter((b) => b.id !== id));
    // if the lastBooking was this, clear it
    if (lastBooking?.id === id) setLastBooking(null);
  }

  // --- Admin functions ---
  function addTable(name, seats) {
    const id = `T${Math.floor(Math.random() * 9000) + 1000}`; // 4-digit ID
    setTables((s) => [...s, { id, name, seats: Number(seats) }]);
  }

  function removeTable(id) {
    // Also remove future bookings for this table
    setTables((s) => s.filter((t) => t.id !== id));
    setBookings((s) => s.filter((b) => b.tableId !== id));
  }

  // --- Small UI components ---
  function Header() {
    return (
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">SimpleTable — Booking Simulator</h1>
          <nav className="flex gap-2">
            <button onClick={() => setPage("home")} className={navBtn(page === "home")}>Home</button>
            <button onClick={() => setPage("booking")} className={navBtn(page === "booking")}>Book</button>
            <button onClick={() => setPage("mybookings") } className={navBtn(page === "mybookings")}>My Bookings</button>
            <button onClick={() => setPage("admin")} className={navBtn(page === "admin")}>Admin</button>
          </nav>
        </div>
      </header>
    );
  }

  function navBtn(active) {
    return `px-3 py-1 rounded-md transition-colors ${active ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-50"}`;
  }

  function HomePage() {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to SimpleTable</h2>
        <p className="text-gray-700 mb-6">
          Reserve a table in seconds. Try the booking flow or manage tables in Admin.
        </p>

        <div className="flex gap-4">
          <button
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
            onClick={() => {
              setPage("booking");
              setSelected((s) => ({ ...s, date: todayISO() }));
            }}
          >
            Book a Table
          </button>
          <button
            className="px-5 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
            onClick={() => setPage("mybookings")}
          >
            My Bookings
          </button>
        </div>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">How it works</h3>
          <ol className="list-decimal pl-5 text-gray-700 space-y-1">
            <li>Pick date, time and number of guests.</li>
            <li>See available tables that fit your party.</li>
            <li>Confirm your booking — it will appear under **My Bookings**.</li>
          </ol>
        </section>
      </div>
    );
  }

  function BookingPage() {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Find a table</h2>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <label htmlFor="date-input" className="block mb-1 text-sm font-medium text-gray-700">Date</label>
            <input
              id="date-input"
              type="date"
              className="border rounded px-3 py-2 w-full sm:w-40"
              value={selected.date}
              onChange={(e) => setSelected((s) => ({ ...s, date: e.target.value }))}
              min={todayISO()}
            />
          </div>
          <div>
            <label htmlFor="time-input" className="block mb-1 text-sm font-medium text-gray-700">Time</label>
            <input
              id="time-input"
              type="time"
              className="border rounded px-3 py-2 w-full sm:w-40"
              value={selected.time}
              onChange={(e) => setSelected((s) => ({ ...s, time: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="guests-input" className="block mb-1 text-sm font-medium text-gray-700">Guests</label>
            <input
              id="guests-input"
              type="number"
              min={1}
              className="border rounded px-3 py-2 w-full sm:w-24"
              value={selected.guests}
              onChange={(e) => setSelected((s) => ({ ...s, guests: Number(e.target.value) }))}
            />
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={handleSearchAvail}
              disabled={!selected.date}
            >
              Check Availability
            </button>
            <button className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100 transition" onClick={() => setPage("home")}>Back</button>
          </div>
        </div>

        {availableTables.length > 0 && (
          <section className="mt-6">
            <h3 className="font-semibold mb-3 text-lg text-gray-800">Available tables for {selected.date} @ {selected.time}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTables.map((t) => (
                <div key={t.id} className="p-4 border border-green-200 rounded-lg flex items-center justify-between bg-green-50">
                  <div>
                    <div className="font-semibold text-gray-800">{t.name} ({t.seats} seats)</div>
                    <div className="text-gray-500 text-sm">Table ID: {t.id}</div>
                  </div>
                  <div>
                    <button
                      className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                      onClick={() => makeBooking(t.id)}
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {selected.date && availableTables.length === 0 && (
          <p className="text-gray-600 mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            No available tables found for the selected criteria. Try a different time or increase guest count.
          </p>
        )}
        {!selected.date && (
            <p className="text-gray-600 mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                Please select a date to check availability.
            </p>
        )}
      </div>
    );
  }

  function ConfirmationPage() {
    if (!lastBooking)
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded p-6 shadow-lg border-l-4 border-yellow-500">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">No Recent Booking</h2>
            <p className="text-gray-700">Go to **Book** page to create one.</p>
          </div>
        </div>
      );

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded p-6 shadow-lg border-l-4 border-green-500">
          <h2 className="text-2xl font-bold mb-4 text-green-600">🎉 Booking Confirmed!</h2>
          <p className="text-gray-700 mb-6">Thanks — your table is reserved. Here are the details:</p>
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg text-gray-800">
            <div><strong className="font-semibold">Booking ID:</strong> {lastBooking.id}</div>
            <div><strong className="font-semibold">Table:</strong> {lastBooking.tableName} ({lastBooking.seats} seats)</div>
            <div><strong className="font-semibold">Date & Time:</strong> {lastBooking.date} @ {lastBooking.time}</div>
            <div><strong className="font-semibold">Guests:</strong> {lastBooking.guests}</div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setPage("mybookings")} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition">View My Bookings</button>
            <button onClick={() => setPage("home")} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100 transition">Home</button>
          </div>
        </div>
      </div>
    );
  }

  function MyBookingsPage() {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Bookings</h2>

          {bookings.length === 0 ? (
            <p className="text-gray-600 p-4 border rounded-lg">You have no bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50">
                  <div>
                    <div className="font-bold text-gray-800">{b.tableName} — {b.date} @ {b.time}</div>
                    <div className="text-sm text-gray-600">Guests: {b.guests} • Booking ID: {b.id}</div>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0">
                    <button
                      className="px-3 py-1 rounded border text-gray-700 hover:bg-gray-100 transition text-sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(b.id);
                        alert('Booking ID copied');
                      }}
                    >
                      Copy ID
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition text-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this booking?')) {
                            cancelBooking(b.id)
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function AdminPage() {
    const [newName, setNewName] = useState("");
    const [newSeats, setNewSeats] = useState(2);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">⚙️ Admin — Manage Tables & Bookings</h2>

          <section className="mb-8 p-4 border rounded-lg bg-indigo-50">
            <h3 className="font-bold text-lg mb-3 text-indigo-800">Add New Table</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Table Name</label>
                <input
                  className="border rounded px-3 py-2"
                  placeholder="e.g., Booth 3"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Seats</label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-20"
                  min={1}
                  value={newSeats}
                  onChange={(e) => setNewSeats(e.target.value)}
                />
              </div>
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                onClick={() => {
                  if (!newName.trim()) return alert('Please provide a table name.');
                  addTable(newName.trim(), newSeats);
                  setNewName('');
                  setNewSeats(2);
                }}
              >
                Add Table
              </button>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-800">Tables ({tables.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tables.map((t) => (
                <div key={t.id} className="p-3 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                  <div>
                    <div className="font-semibold text-gray-800">{t.name} ({t.seats} seats)</div>
                    <div className="text-sm text-gray-600">ID: {t.id}</div>
                  </div>
                  <div>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition text-sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove table "${t.name}" (${t.id}) and all its associated bookings?`)) removeTable(t.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3 text-gray-800">All Bookings ({bookings.length})</h3>
            {bookings.length === 0 ? (
              <p className="text-gray-600 p-4 border rounded-lg">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="p-3 border rounded flex justify-between items-center bg-yellow-50 shadow-sm">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-800">
                        {b.tableName} — {b.date} @ {b.time}
                      </div>
                      <div className="text-xs text-gray-600">ID: {b.id} • Guests: {b.guests}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100 transition text-xs"
                        onClick={() => {
                          navigator.clipboard?.writeText(b.id);
                          alert('Booking ID copied');
                        }}
                      >
                        Copy ID
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition text-xs"
                        onClick={() => {
                          if (window.confirm(`Cancel booking ${b.id} for ${b.tableName} on ${b.date}?`)) cancelBooking(b.id);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // --- Main render ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow pt-6 pb-12">
        {page === "home" && <HomePage />}
        {page === "booking" && <BookingPage />}
        {page === "confirm" && <ConfirmationPage />}
        {page === "mybookings" && <MyBookingsPage />}
        {page === "admin" && <AdminPage />}
      </main>
      <footer className="text-center py-4 text-sm text-gray-500 border-t">
        Demo app — data saved locally in your browser (**localStorage**).
      </footer>
    </div>
  );
}
