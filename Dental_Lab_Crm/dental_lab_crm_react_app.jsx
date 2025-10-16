import React, { useEffect, useState } from "react";

// DentalLab CRM - Single-file React component
// - Uses Tailwind CSS classes for styling (ensure Tailwind is available in your project)
// - Stores data in localStorage under key 'dentallab_orders'
// - Features: dashboard, add order, edit order, update status, search/filter, CSV export/import
// - To run: drop into a Create React App or Vite project and render <DentalLabCRM /> in App.jsx

const STATUS = ["Received", "In Progress", "Completed", "Delivered", "Cancelled"];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultOrders() {
  return [
    {
      id: uid(),
      clinic: "Zahnklinik Berlin",
      contact: "dr.bauer@zahnklinik.de",
      type: "Crown (Zr)",
      receivedDate: "2025-10-10",
      dueDate: "2025-10-20",
      status: "In Progress",
      notes: "Shade A2. Implant abutment included.",
    },
    {
      id: uid(),
      clinic: "SmileCare Munich",
      contact: "info@smilecare.de",
      type: "Bridge 3-unit",
      receivedDate: "2025-10-12",
      dueDate: "2025-10-25",
      status: "Received",
      notes: "Rush possible if needed.",
    },
  ];
}

export default function DentalLabCRM() {
  const [orders, setOrders] = useState(() => {
    try {
      const raw = localStorage.getItem("dentallab_orders");
      return raw ? JSON.parse(raw) : defaultOrders();
    } catch (e) {
      return defaultOrders();
    }
  });

  const [filter, setFilter] = useState({ q: "", status: "All", clinic: "" });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [sortBy, setSortBy] = useState("receivedDate");

  useEffect(() => {
    localStorage.setItem("dentallab_orders", JSON.stringify(orders));
  }, [orders]);

  function emptyForm() {
    return {
      clinic: "",
      contact: "",
      type: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "Received",
      notes: "",
    };
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(order) {
    setEditing(order.id);
    setForm({ ...order });
    setShowForm(true);
  }

  function saveForm(e) {
    e.preventDefault();
    if (editing) {
      setOrders((s) => s.map((o) => (o.id === editing ? { ...form, id: editing } : o)));
    } else {
      setOrders((s) => [{ ...form, id: uid() }, ...s]);
    }
    setShowForm(false);
  }

  function changeStatus(id, nextStatus) {
    setOrders((s) => s.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
  }

  function removeOrder(id) {
    if (!confirm("Delete this order?")) return;
    setOrders((s) => s.filter((o) => o.id !== id));
  }

  function filtered() {
    let list = [...orders];
    if (filter.status !== "All") list = list.filter((o) => o.status === filter.status);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (o) =>
          o.clinic.toLowerCase().includes(q) ||
          (o.contact || "").toLowerCase().includes(q) ||
          (o.type || "").toLowerCase().includes(q) ||
          (o.notes || "").toLowerCase().includes(q)
      );
    }
    if (filter.clinic) list = list.filter((o) => o.clinic === filter.clinic);
    list.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));
    return list;
  }

  function exportCSV() {
    const headers = ["id", "clinic", "contact", "type", "receivedDate", "dueDate", "status", "notes"];
    const rows = [headers.join(",")];
    for (const o of orders) {
      rows.push(
        headers
          .map((h) => {
            const v = o[h] ?? "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(",")
      );
    }
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dentallab_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(text) {
    // naive CSV import; expects header row matching export
    try {
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));
      const data = lines.slice(1).map((ln) => {
        // split respecting quoted values
        const values = ln.match(/(?:"([^"]*(?:""[^"]*)*)")|([^,]+)/g).map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
        if (!obj.id) obj.id = uid();
        return obj;
      });
      setOrders((s) => [...data, ...s]);
      alert("Imported " + data.length + " rows.");
    } catch (e) {
      alert("Failed to import CSV: " + e.message);
    }
  }

  function handleCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => importCSV(ev.target.result);
    reader.readAsText(file);
  }

  const clinics = Array.from(new Set(orders.map((o) => o.clinic))).slice(0, 50);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">DentalLab CRM</h1>
            <p className="text-sm text-gray-600">Track clinic orders, statuses and communicate with ease.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
              onClick={openNew}
            >
              + New Order
            </button>
            <div className="relative">
              <button
                className="px-4 py-2 border rounded-lg bg-white"
                onClick={() => exportCSV()}
              >
                Export CSV
              </button>
            </div>
            <label className="px-4 py-2 border rounded-lg bg-white cursor-pointer">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files && handleCSVFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex gap-2 flex-wrap mb-3">
              <input
                value={filter.q}
                onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search clinics, types, notes..."
                className="flex-1 border px-3 py-2 rounded"
              />
              <select
                value={filter.status}
                onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                className="border px-3 py-2 rounded"
              >
                <option value="All">All statuses</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filter.clinic}
                onChange={(e) => setFilter((f) => ({ ...f, clinic: e.target.value }))}
                className="border px-3 py-2 rounded"
              >
                <option value="">All clinics</option>
                {clinics.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border px-3 py-2 rounded"
              >
                <option value="receivedDate">Sort by received</option>
                <option value="dueDate">Sort by due date</option>
                <option value="clinic">Sort by clinic</option>
                <option value="status">Sort by status</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead className="text-sm text-gray-600">
                  <tr>
                    <th className="p-2">Clinic</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Received</th>
                    <th className="p-2">Due</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered().map((o) => (
                    <tr key={o.id} className="bg-white border-b">
                      <td className="p-2 align-top">
                        <div className="font-medium">{o.clinic}</div>
                        <div className="text-xs text-gray-500">{o.contact}</div>
                      </td>
                      <td className="p-2 align-top">{o.type}</td>
                      <td className="p-2 align-top">{o.receivedDate}</td>
                      <td className="p-2 align-top">{o.dueDate}</td>
                      <td className="p-2 align-top">
                        <div className="inline-flex gap-1 items-center">
                          <span className="text-sm">{o.status}</span>
                        </div>
                        <div className="mt-2 text-xs flex gap-1 flex-wrap">
                          {STATUS.map((s) => (
                            <button
                              key={s}
                              onClick={() => changeStatus(o.id, s)}
                              className={`px-2 py-1 text-xs rounded ${o.status===s?"bg-indigo-600 text-white":"border bg-white"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(o)} className="px-2 py-1 border rounded">Edit</button>
                          <button onClick={() => removeOrder(o.id)} className="px-2 py-1 border rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="text-sm text-gray-700 mb-2">Total orders: {orders.length}</div>
            {STATUS.map((s) => (
              <div key={s} className="flex justify-between text-sm">
                <div>{s}</div>
                <div className="font-semibold">{orders.filter((o) => o.status === s).length}</div>
              </div>
            ))}
            <hr className="my-3" />
            <div className="text-sm">
              <strong>Quick actions</strong>
              <div className="mt-2 flex flex-col gap-2">
                <button onClick={() => setOrders(defaultOrders())} className="px-3 py-2 border rounded">Load sample data</button>
                <button onClick={() => { if(confirm('Clear all orders?')) setOrders([]) }} className="px-3 py-2 border rounded">Clear all</button>
              </div>
            </div>
          </aside>
        </section>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{editing ? "Edit Order" : "New Order"}</h2>
              <form onSubmit={saveForm} className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required placeholder="Clinic name" value={form.clinic} onChange={(e)=>setForm({...form, clinic:e.target.value})} className="border px-3 py-2 rounded" />
                  <input placeholder="Contact (email/phone)" value={form.contact} onChange={(e)=>setForm({...form, contact:e.target.value})} className="border px-3 py-2 rounded" />
                </div>
                <input placeholder="Type (e.g., Crown, Bridge)" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} className="border px-3 py-2 rounded" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col text-sm">
                    Received date
                    <input type="date" value={form.receivedDate} onChange={(e)=>setForm({...form, receivedDate:e.target.value})} className="border px-3 py-2 rounded mt-1" />
                  </label>
                  <label className="flex flex-col text-sm">
                    Due date
                    <input type="date" value={form.dueDate} onChange={(e)=>setForm({...form, dueDate:e.target.value})} className="border px-3 py-2 rounded mt-1" />
                  </label>
                </div>

                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})} className="border px-3 py-2 rounded w-full">
                    {STATUS.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <textarea placeholder="Notes" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} className="border px-3 py-2 rounded min-h-[80px]" />

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-gray-500 mt-6">DentalLab CRM • Local demo • Data stored in browser</footer>
      </div>
    </div>
  );
}
