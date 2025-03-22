'use client'
import { useEffect, useState } from "react";
import styles from "./styles/reservas.module.css";

interface IBooking {
  id: number;
  date?: string;     
  time?: string;     
  reserved: boolean;
}

interface IService {
  id: number;
  nameService: string;
  bookings: IBooking[];
}

interface PutBookingDto {
  Name: string;
  NameService: string;
  Date: string; 
}

const ReservasPage = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Formato "YYYY-MM-DD"
  const [availableBookings, setAvailableBookings] = useState<IBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:5298/api/reservas");
        const text = await res.text();
        const data: IService[] = text ? JSON.parse(text) : [];
        setServices(data);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setAvailableBookings([]);
      setSelectedBookingId(null);
      return;
    }
    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) {
      setAvailableBookings([]);
      setSelectedBookingId(null);
      return;
    }
    const dateFiltered = service.bookings.filter((b) => {
      if (!b.date) return false;
      return isSameDay(b.date, selectedDate) && !b.reserved;
    });
    setAvailableBookings(dateFiltered);
    if (selectedBookingId && !dateFiltered.find((b) => b.id === selectedBookingId)) {
      setSelectedBookingId(null);
    }
  }, [selectedServiceId, selectedDate, services, selectedBookingId]);

  const handleReserve = async () => {
    if (!clientName || !selectedDate || !selectedServiceId || !selectedBookingId) {
      setMessage("Por favor, complete todos los campos.");
      return;
    }
    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) {
      setMessage("Servicio no encontrado.");
      return;
    }
    const booking = service.bookings.find((b) => b.id === selectedBookingId);
    if (!booking) {
      setMessage("No se encontró el horario seleccionado.");
      return;
    }
    const timeStr = booking.time?.slice(0, 5) || "00:00";
    const localDateTimeString = `${selectedDate} ${timeStr}:00`;
    console.log("Local date/time string:", localDateTimeString);

    const payload: PutBookingDto = {
      Name: clientName,
      NameService: service.nameService,
      Date: localDateTimeString
    };

    try {
      const res = await fetch("http://localhost:5298/api/reservas", {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Error al parsear JSON:", err);
        }
      }
      if (res.ok) {
        setMessage("Reserva creada exitosamente.");
        const updatedRes = await fetch("http://localhost:5298/api/reservas");
        const updatedText = await updatedRes.text();
        const updatedData: IService[] = updatedText ? JSON.parse(updatedText) : [];
        setServices(updatedData);
      } else {
        setMessage(`Error al reservar: ${(data as any).message || res.statusText}`);
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      setMessage("Error al crear reserva.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Generar Reserva</h1>
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Servicio:</label>
          <select
            className={styles.select}
            value={selectedServiceId || ""}
            onChange={(e) => setSelectedServiceId(Number(e.target.value))}
          >
            <option value="">-- Seleccione un servicio --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameService}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nombre del Cliente:</label>
          <input
            className={styles.input}
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Fecha:</label>
          <input
            className={styles.input}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {availableBookings.length > 0 && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Horarios Disponibles:</label>
            <select
              className={styles.select}
              value={selectedBookingId || ""}
              onChange={(e) => setSelectedBookingId(Number(e.target.value))}
            >
              <option value="">-- Seleccione un horario --</option>
              {availableBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.time ? b.time.slice(0, 5) : "Sin hora"}
                </option>
              ))}
            </select>
          </div>
        )}

        <button className={styles.btn} onClick={handleReserve}>
          Reservar
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </div>

      <hr style={{ margin: "2rem 0" }} />

      <h2 className={styles.subtitle}>Listado de Reservas Generadas</h2>
      {services.map((s) => (
        <div key={s.id} className={styles.serviceCard}>
          <h3>{s.nameService}</h3>
          {s.bookings && s.bookings.length > 0 ? (
            <ul className={styles.bookingList}>
              {s.bookings.map((b) => (
                <li key={b.id}>
                  Fecha: {b.date ? new Date(b.date).toLocaleDateString() : "N/A"} - Hora: {b.time ? b.time.slice(0,5) : "N/A"} - {b.reserved ? "Reservado" : "Disponible"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay reservas para este servicio.</p>
          )}
        </div>
      ))}
    </div>
  );
};

function isSameDay(dateISO: string, selectedDate: string): boolean {
  const d = new Date(dateISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` === selectedDate;
}

export default ReservasPage;
