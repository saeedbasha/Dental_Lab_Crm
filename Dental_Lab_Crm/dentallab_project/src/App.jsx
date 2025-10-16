import React, { useEffect, useState } from "react";

const STATUS = ["Received", "In Progress", "Completed", "Delivered", "Cancelled"];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function emptyForm() {
  return {
    clinic: "",
    contact: "",
    type: "",
    receivedDate: new Date().toISOString().slice(0,10),
    dueDate: "",
    status: "Received",
    notes: "",
  };
}

const translations = {
  en: {
    title: "DentalLab CRM",
    newOrder: "+ New Order",
    searchPlaceholder: "Search clinics, types, notes...",
    allStatuses: "All statuses",
    allClinics: "All clinics",
    sortBy: "Sort by",
    received: "Received",
    dueDate: "Due date",
    status: "Status",
    actions: "Actions",
    summary: "Summary",
    totalOrders: "Total orders",
    quickActions: "Quick actions",
    loadSample: "Load sample data",
    clearAll: "Clear all",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    receivedDate: "Received date",
    typeLabel: "Type (e.g., Crown, Bridge)",
    contactLabel: "Contact (email/phone)",
    notes: "Notes",
    importCSV: "Import CSV",
    exportCSV: "Export CSV",
    language: "EN / AR"
  },
  ar: {
    title: "نظام إدارة مخبر الأسنان",
    newOrder: "+ طلب جديد",
    searchPlaceholder: "ابحث عن العيادات، النوع، الملاحظات...",
    allStatuses: "كل الحالات",
    allClinics: "كل العيادات",
    sortBy: "فرز حسب",
    received: "تاريخ الاستلام",
    dueDate: "تاريخ الاستحقاق",
    status: "الحالة",
    actions: "الإجراءات",
    summary: "ملخص",
    totalOrders: "إجمالي الطلبات",
    quickActions: "إجراءات سريعة",
    loadSample: "تحميل بيانات نموذجية",
    clearAll: "مسح الكل",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    receivedDate: "تاريخ الاستلام",
    typeLabel: "النوع (مثال: تركيب، جسر)",
    contactLabel: "جهة الاتصال (البريد/الهاتف)",
    notes: "ملاحظات",
    importCSV: "استيراد CSV",
    exportCSV: "تصدير CSV",
    language: "EN / AR"
  }
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('dl_lang') || 'en');
  const [orders, setOrders] = useState(() => {
    try {
      const raw = localStorage.getItem('dentallab_orders');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [filter, setFilter] = useState({ q: '', status: 'All', clinic: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [sortBy, setSortBy] = useState('receivedDate');

  useEffect(() => {
    localStorage.setItem('dentallab_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('dl_lang', lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'ar';
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

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
      setOrders(s => s.map(o => o.id === editing ? { ...form, id: editing } : o));
    } else {
      setOrders(s => [{ ...form, id: uid() }, ...s]);
    }
    setShowForm(false);
  }

  function changeStatus(id, nextStatus) {
    setOrders(s => s.map(o => o.id === id ? { ...o, status: nextStatus } : o));
  }

  function removeOrder(id) {
    if (!window.confirm(lang === 'en' ? 'Delete this order?' : 'هل تريد حذف هذا الطلب؟')) return;
    setOrders(s => s.filter(o => o.id !== id));
  }

  function filtered() {
    let list = [...orders];
    if (filter.status !== 'All') list = list.filter(o => o.status === filter.status);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(o =>
        (o.clinic || '').toLowerCase().includes(q) ||
        (o.contact || '').toLowerCase().includes(q) ||
        (o.type || '').toLowerCase().includes(q) ||
        (o.notes || '').toLowerCase().includes(q)
      );
    }
    if (filter.clinic) list = list.filter(o => o.clinic === filter.clinic);
    list.sort((a,b) => (a[sortBy] > b[sortBy] ? 1 : -1));
    return list;
  }

  function exportCSV() {
    const headers = ['id','clinic','contact','type','receivedDate','dueDate','status','notes'];
    const rows = [headers.join(',')];
    for (const o of orders) {
      rows.push(headers.map(h => `\"${String(o[h]||'').replace(/\"/g,'\"\"')}\"`).join(','));
    }
    const csv = rows.join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dentallab_orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(text) {
    try {
      const lines = text.split(/\\r?\\n/).filter(Boolean);
      const headers = lines[0].split(',').map(h => h.replace(/\"/g,''));
      const data = lines.slice(1).map(ln => {
        const values = ln.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)/g).map(v => v.replace(/^\"|\"$/g,'').replace(/\"\"/g,'\"'));
        const obj = {};
        headers.forEach((h,i) => obj[h] = values[i] || '');
        if (!obj.id) obj.id = uid();
        return obj;
      });
      setOrders(s => [...data, ...s]);
      alert((lang==='en'?'Imported ':'تم استيراد ') + data.length + (lang==='en'?' rows.':' صف.'));
    } catch (e) {
      alert((lang==='en'?'Failed to import CSV: ':'فشل استيراد CSV: ') + e.message);
    }
  }

  function handleCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => importCSV(ev.target.result);
    reader.readAsText(file);
  }

  const clinics = Array.from(new Set(orders.map(o => o.clinic))).slice(0,50);
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-sm text-gray-600">Track clinic orders, statuses and communicate with ease.</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-sm text-gray-500 mr-2 hidden sm:block">{t.language}</div>
            <div className="border rounded-lg overflow-hidden flex">
              <button onClick={() => setLang('en')} className={`px-3 py-2 ${lang==='en' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>EN</button>
              <button onClick={() => setLang('ar')} className={`px-3 py-2 ${lang==='ar' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>AR</button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex gap-2 flex-wrap mb-3">
              <input
                value={filter.q}
                onChange={(e) => setFilter(f => ({ ...f, q: e.target.value }))}
                placeholder={t.searchPlaceholder}
                className="flex-1 border px-3 py-2 rounded"
              />
              <select value={filter.status} onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))} className="border px-3 py-2 rounded">
                <option value="All">{t.allStatuses}</option>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filter.clinic} onChange={(e) => setFilter(f => ({ ...f, clinic: e.target.value }))} className="border px-3 py-2 rounded">
                <option value="">{t.allClinics}</option>
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border px-3 py-2 rounded">
                <option value="receivedDate">{t.received}</option>
                <option value="dueDate">{t.dueDate}</option>
                <option value="clinic">Clinic</option>
                <option value="status">{t.status}</option>
              </select>
              <button onClick={openNew} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm">{t.newOrder}</button>
              <button onClick={exportCSV} className="px-4 py-2 border rounded-lg bg-white">{t.exportCSV}</button>
              <label className="px-4 py-2 border rounded-lg bg-white cursor-pointer">
                {t.importCSV}
                <input type="file" accept=".csv" onChange={(e)=> e.target.files && handleCSVFile(e.target.files[0])} className="hidden" />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead className="text-sm text-gray-600">
                  <tr>
                    <th className="p-2">Clinic</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">{t.received}</th>
                    <th className="p-2">{t.dueDate}</th>
                    <th className="p-2">{t.status}</th>
                    <th className="p-2">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered().map(o => (
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
                          {STATUS.map(s => (
                            <button key={s} onClick={() => changeStatus(o.id, s)} className={`px-2 py-1 text-xs rounded ${o.status===s?'bg-indigo-600 text-white':'border bg-white'}`}>{s}</button>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(o)} className="px-2 py-1 border rounded">{t.edit}</button>
                          <button onClick={() => removeOrder(o.id)} className="px-2 py-1 border rounded">{t.delete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">{t.summary}</h3>
            <div className="text-sm text-gray-700 mb-2">{t.totalOrders}: {orders.length}</div>
            {STATUS.map(s => (
              <div key={s} className="flex justify-between text-sm">
                <div>{s}</div>
                <div className="font-semibold">{orders.filter(o => o.status === s).length}</div>
              </div>
            ))}
            <hr className="my-3" />
            <div className="text-sm">
              <strong>{t.quickActions}</strong>
              <div className="mt-2 flex flex-col gap-2">
                <button onClick={() => setOrders([
                  { id: uid(), clinic: 'Zahnklinik Berlin', contact: 'dr.bauer@zahnklinik.de', type: 'Crown (Zr)', receivedDate: '2025-10-10', dueDate: '2025-10-20', status: 'In Progress', notes: 'Shade A2' },
                  { id: uid(), clinic: 'SmileCare Munich', contact: 'info@smilecare.de', type: 'Bridge 3-unit', receivedDate: '2025-10-12', dueDate: '2025-10-25', status: 'Received', notes: 'Rush possible' },
                ])} className="px-3 py-2 border rounded">{t.loadSample}</button>
                <button onClick={() => { if(window.confirm(lang==='en'?'Clear all orders?':'هل تريد مسح جميع الطلبات؟')) setOrders([]) }} className="px-3 py-2 border rounded">{t.clearAll}</button>
              </div>
            </div>
          </aside>
        </section>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6" dir={lang==='ar'?'rtl':'ltr'}>
              <h2 className="text-xl font-semibold mb-4">{editing? t.edit : t.newOrder}</h2>
              <form onSubmit={saveForm} className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required placeholder={lang==='en'?'Clinic name':'اسم العيادة'} value={form.clinic} onChange={(e)=>setForm({...form, clinic:e.target.value})} className="border px-3 py-2 rounded" />
                  <input placeholder={t.contactLabel} value={form.contact} onChange={(e)=>setForm({...form, contact:e.target.value})} className="border px-3 py-2 rounded" />
                </div>
                <input placeholder={t.typeLabel} value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} className="border px-3 py-2 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col text-sm">
                    {t.receivedDate}
                    <input type="date" value={form.receivedDate} onChange={(e)=>setForm({...form, receivedDate:e.target.value})} className="border px-3 py-2 rounded mt-1" />
                  </label>
                  <label className="flex flex-col text-sm">
                    {t.dueDate}
                    <input type="date" value={form.dueDate} onChange={(e)=>setForm({...form, dueDate:e.target.value})} className="border px-3 py-2 rounded mt-1" />
                  </label>
                </div>

                <div>
                  <label className="block text-sm mb-1">{t.status}</label>
                  <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})} className="border px-3 py-2 rounded w-full">
                    {STATUS.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <textarea placeholder={t.notes} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} className="border px-3 py-2 rounded min-h-[80px]" />

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 border rounded">{t.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">{t.save}</button>
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