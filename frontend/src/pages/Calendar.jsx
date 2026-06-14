import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock3,
  Trash2,
  Pencil,
} from "lucide-react";
import "../css/Calendar.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3333"
).replace(/\/$/, "");

function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

const COLOR_OPTIONS = [
  {
    value: "emerald",
    label: "🟢: Progres Proyek",
    badgeClass: "border border-emerald-200 bg-emerald-100 text-emerald-700",
    dotClass: "bg-emerald-500",
    shortLabel: "progres",
  },
  {
    value: "blue",
    label: "🔵: Pengiriman Material",
    badgeClass: "border border-blue-200 bg-blue-100 text-blue-700",
    dotClass: "bg-blue-500",
    shortLabel: "material",
  },
  {
    value: "amber",
    label: "🟡: Kunjungan Lapangan",
    badgeClass: "border border-amber-200 bg-amber-100 text-amber-700",
    dotClass: "bg-amber-500",
    shortLabel: "kunjungan",
  },
  {
    value: "red",
    label: "🔴: Deadline",
    badgeClass: "border border-red-200 bg-red-100 text-red-700",
    dotClass: "bg-red-500",
    shortLabel: "deadline",
  },
];

function getTodayString() {
  return formatDateToYMD(new Date());
}

function createEmptyForm(date = "") {
  return {
    title: "",
    date,
    startTime: "09:00",
    endTime: "10:00",
    colorKey: "emerald",
    description: "",
  };
}

function getColorMeta(colorKey) {
  return (
    COLOR_OPTIONS.find((item) => item.value === colorKey) || COLOR_OPTIONS[0]
  );
}

function formatFullDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatShortDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function sortEvents(list) {
  return [...list].sort((a, b) => {
    const aDateTime = `${a.start}T${a.extendedProps?.startTime || "00:00"}`;
    const bDateTime = `${b.start}T${b.extendedProps?.startTime || "00:00"}`;
    return new Date(aDateTime) - new Date(bDateTime);
  });
}

function formatDateToYMD(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeCalendarEvent(event) {
  const extendedProps = event?.extendedProps || {};

  return {
    id: String(event?.id),
    title: event?.title || "Acara Tanpa Judul",
    start: event?.start || event?.date || event?.eventDate,
    allDay: true,
    extendedProps: {
      colorKey: extendedProps.colorKey || event?.colorKey || "emerald",
      description: extendedProps.description || event?.description || "",
      startTime: extendedProps.startTime || event?.startTime || "09:00",
      endTime: extendedProps.endTime || event?.endTime || "10:00",
    },
  };
}

export default function Calendar() {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(createEmptyForm(getTodayString()));
  const [holidayDates, setHolidayDates] = useState(new Set());
  const [holidayDetails, setHolidayDetails] = useState([]);
  const [loadedHolidayYear, setLoadedHolidayYear] = useState(null);

  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formError, setFormError] = useState("");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#16a34a] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(22,163,74,0.24)] transition hover:bg-[#15803d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70";

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return sortEvents(events.filter((event) => event.start === selectedDate));
  }, [events, selectedDate]);

  const selectedDateHolidays = useMemo(() => {
    if (!selectedDate) return [];
    return holidayDetails.filter((holiday) => holiday.date === selectedDate);
  }, [holidayDetails, selectedDate]);

  const selectedDateTotalItems =
    selectedDateEvents.length + selectedDateHolidays.length;

  const upcomingEvents = useMemo(() => {
    return sortEvents(events).slice(0, 5);
  }, [events]);

  const fetchCalendarEvents = async () => {
    try {
      setIsEventsLoading(true);

      const response = await fetch(buildApiUrl("/api/calendar-events"), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Gagal mengambil data acara kalender");
      }

      const backendEvents = Array.isArray(data.events) ? data.events : [];
      setEvents(backendEvents.map((event) => normalizeCalendarEvent(event)));
    } catch (error) {
      console.error("Fetch calendar events error:", error);
      setEvents([]);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const fetchIndonesiaHolidays = async (year) => {
    try {
      const response = await fetch(buildApiUrl(`/api/holidays/${year}`), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal mengambil data hari libur dari server",
        );
      }

      const holidays = Array.isArray(data.holidays) ? data.holidays : [];

      const details = Array.isArray(data.holidayDetails)
        ? data.holidayDetails
        : holidays.map((date) => ({
            id: `holiday-${date}`,
            date,
            name: "Hari Libur Nasional",
            description: "Tanggal merah dari Google Calendar API",
            htmlLink: "",
          }));

      setHolidayDates(new Set(holidays));
      setHolidayDetails(details);
      setLoadedHolidayYear(year);
    } catch (error) {
      console.error("Fetch holiday error:", error);
      setHolidayDates(new Set());
      setHolidayDetails([]);
      setLoadedHolidayYear(year);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const openAddEventModal = (dateString = getTodayString()) => {
    setEditingEventId(null);
    setFormError("");
    setForm(createEmptyForm(dateString));
    setIsModalOpen(true);
  };

  const openEditEventModal = (event) => {
    setEditingEventId(event.id);
    setFormError("");

    setForm({
      title: event.title || "",
      date: event.start || getTodayString(),
      startTime: event.extendedProps?.startTime || "09:00",
      endTime: event.extendedProps?.endTime || "10:00",
      colorKey: event.extendedProps?.colorKey || "emerald",
      description: event.extendedProps?.description || "",
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormError("");
    setForm(createEmptyForm(getTodayString()));
  };

  const openDeleteConfirm = (eventId) => {
    setDeleteTargetId(eventId);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setIsDeletingEvent(true);

      const response = await fetch(
        buildApiUrl(`/api/calendar-events/${deleteTargetId}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Gagal menghapus acara.");
      }

      setEvents((prev) =>
        prev.filter((event) => String(event.id) !== String(deleteTargetId)),
      );

      closeDeleteConfirm();
    } catch (error) {
      console.error("Delete calendar event error:", error);
      alert(error.message || "Gagal menghapus acara.");
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
  };

  const handleEventClick = (clickInfo) => {
    clickInfo.jsEvent.preventDefault();
    setSelectedDate(clickInfo.event.startStr);
  };

  const handlePrevMonth = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    api.prev();
    setCurrentTitle(api.view.title);
  };

  const handleNextMonth = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    api.next();
    setCurrentTitle(api.view.title);
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    api.today();
    setCurrentTitle(api.view.title);
  };

  const handleChangeForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.title.trim() || !form.date) {
      setFormError("Judul dan Tanggal wajib diisi.");
      return;
    }

    if (form.startTime && form.endTime && form.endTime < form.startTime) {
      setFormError("Waktu selesai tidak boleh lebih awal dari waktu mulai.");
      return;
    }

    try {
      setIsSavingEvent(true);

      const isEditMode = Boolean(editingEventId);

      const response = await fetch(
        buildApiUrl(
          isEditMode
            ? `/api/calendar-events/${editingEventId}`
            : "/api/calendar-events",
        ),
        {
          method: isEditMode ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: form.title.trim(),
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            colorKey: form.colorKey,
            description: form.description.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Gagal menyimpan acara.");
      }

      const savedEvent = normalizeCalendarEvent(data.event);

      setEvents((prev) => {
        if (isEditMode) {
          return prev.map((event) =>
            String(event.id) === String(savedEvent.id) ? savedEvent : event,
          );
        }

        return [...prev, savedEvent];
      });

      setSelectedDate(savedEvent.start);
      closeModal();
    } catch (error) {
      console.error("Save acara error:", error);
      setFormError(error.message || "Gagal menyimpan acara.");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleQuickDeleteEvent = (eventId) => {
    openDeleteConfirm(eventId);
  };

  const renderEventContent = (eventInfo) => {
    const colorMeta = getColorMeta(eventInfo.event.extendedProps?.colorKey);

    return (
      <div
        className={`w-full truncate rounded-md px-2 py-1 text-[11px] font-semibold leading-tight ${colorMeta.badgeClass}`}
        title={eventInfo.event.title}
      >
        {eventInfo.event.title}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen w-full bg-slate-100 px-3 py-4 md:px-5 md:py-5 xl:px-6 xl:py-6">
        <div className="w-full max-w-none">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Kalender
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Kelola dan jadwalkan aktivitas proyek interior
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                openAddEventModal(selectedDate || getTodayString())
              }
              className={primaryButtonClass}
            >
              <Plus size={18} />
              Tambah Acara
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <h2 className="ml-2 text-2xl font-bold text-slate-900">
                    {currentTitle || "Kalender"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleToday}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hari Ini
                </button>
              </div>

              <div className="calendar-shell">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={false}
                  height="auto"
                  dayMaxEvents={2}
                  fixedWeekCount={true}
                  showNonCurrentDates={true}
                  datesSet={(info) => {
                    setCurrentTitle(info.view.title);

                    const visibleYear = info.view.currentStart.getFullYear();
                    if (loadedHolidayYear !== visibleYear) {
                      fetchIndonesiaHolidays(visibleYear);
                    }
                  }}
                  dayCellClassNames={(arg) => {
                    const dateStr = formatDateToYMD(arg.date);
                    const classNames = [];

                    if (holidayDates.has(dateStr)) {
                      classNames.push("indo-holiday-cell");
                    }

                    if (selectedDate === dateStr) {
                      classNames.push("selected-calendar-day");
                    }

                    return classNames;
                  }}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  events={events}
                  eventDisplay="block"
                  eventContent={renderEventContent}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                {!selectedDate ? (
                  <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Clock3 size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Belum Ada Tanggal Dipilih
                    </h3>
                    <p className="mt-3 max-w-[260px] text-sm leading-6 text-slate-500">
                      Pilih tanggal pada kalender untuk melihat aktivitas
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-bold leading-tight text-slate-900">
                          {formatFullDate(selectedDate)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedDateTotalItems}{" "}
                          {selectedDateTotalItems === 1 ? "acara" : "acara"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAddEventModal(selectedDate)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Plus size={18} />
                          Tambah
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDate("")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {selectedDateTotalItems === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        Belum ada aktivitas pada tanggal ini.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedDateHolidays.map((holiday) => (
                          <div
                            key={
                              holiday.id || `${holiday.date}-${holiday.name}`
                            }
                            className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm"
                          >
                            <div className="mb-3 flex items-start gap-3">
                              <span className="mt-2 inline-flex h-3 w-3 rounded-full bg-red-500" />

                              <div>
                                <h4 className="text-sm font-bold text-red-700">
                                  {holiday.name || "Hari Libur Nasional"}
                                </h4>
                                <p className="mt-1 text-xs font-medium text-red-500">
                                  Hari Libur Nasional
                                </p>
                              </div>
                            </div>

                            {holiday.description ? (
                              <p className="mb-4 text-sm leading-7 text-red-600">
                                {holiday.description}
                              </p>
                            ) : null}

                            <span className="inline-flex rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600">
                              Tanggal Merah
                            </span>
                          </div>
                        ))}

                        {selectedDateEvents.map((event) => {
                          const colorMeta = getColorMeta(
                            event.extendedProps?.colorKey,
                          );

                          return (
                            <div
                              key={event.id}
                              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-2 inline-flex h-3 w-3 rounded-full ${colorMeta.dotClass}`}
                                  />

                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {event.title}
                                    </h4>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      {event.extendedProps?.startTime} -{" "}
                                      {event.extendedProps?.endTime}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditEventModal(event)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-700"
                                    title="Ubah acara"
                                  >
                                    <Pencil size={17} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickDeleteEvent(event.id)
                                    }
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-600"
                                    title="Hapus acara"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>

                              <p className="mb-4 text-sm leading-7 text-slate-500">
                                {event.extendedProps?.description ||
                                  "Belum ada deskripsi."}
                              </p>

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorMeta.badgeClass}`}
                              >
                                {colorMeta.shortLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900">
                  Agenda Mendatang
                </h3>

                {isEventsLoading ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    Belum ada agenda mendatang
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {upcomingEvents.map((event) => {
                      const colorMeta = getColorMeta(
                        event.extendedProps?.colorKey,
                      );

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedDate(event.start)}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                        >
                          <span
                            className={`mt-1 h-3 w-3 rounded-full ${colorMeta.dotClass}`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {event.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatShortDate(event.start)} •{" "}
                              {event.extendedProps?.startTime} -{" "}
                              {event.extendedProps?.endTime}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/30 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-7">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {editingEventId ? "Ubah Acara" : "Tambah Acara"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {editingEventId
                    ? "Perbarui jadwal monitoring proyek interior."
                    : "Tambah jadwal baru untuk monitoring proyek interior."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="px-6 py-6 md:px-7">
              {formError ? (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {formError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Judul</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChangeForm("title", e.target.value)}
                    placeholder="Masukkan judul acara"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tanggal</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChangeForm("date", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Kategori</label>
                  <select
                    value={form.colorKey}
                    onChange={(e) =>
                      handleChangeForm("colorKey", e.target.value)
                    }
                    className={inputClass}
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Waktu Mulai</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      handleChangeForm("startTime", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Waktu Selesai</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      handleChangeForm("endTime", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Deskripsi</label>
                  <textarea
                    rows="4"
                    value={form.description}
                    onChange={(e) =>
                      handleChangeForm("description", e.target.value)
                    }
                    placeholder="Tambahkan deskripsi acara..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className={primaryButtonClass}
                >
                  {isSavingEvent
                    ? "Menyimpan..."
                    : editingEventId
                      ? "Simpan Perubahan"
                      : "Simpan Acara"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/30 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Hapus acara
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Apakah Anda yakin ingin menghapus acara ini?
                </p>
              </div>

              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingEvent}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeletingEvent ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
