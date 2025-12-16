import { useState } from "react";
import api from "../api";

export default function ReviewForm({ contentId }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const token = localStorage.getItem("access");
    if (!token) {
      setMsg("No hay sesión (token). Cierra sesión y vuelve a iniciar.");
      return;
    }

    setLoading(true);

    // ⚠️ Si tu backend usa otra ruta, cambia aquí UNA sola vez:
    const URL = "/ratings/"; // prueba 1
    // const URL = "/rating/"; // si tu backend usa singular
    // const URL = "/reviews/"; // si tu backend usa reviews

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // intento 1: payload típico
      await api.post(
        URL,
        { content: contentId, stars: Number(stars), comment: comment.trim() },
        { headers }
      );

      setMsg("✅ Reseña publicada.");
      setComment("");
      setStars(5);
    } catch (err1) {
      // intento 2: por si tu backend espera content_id
      try {
        await api.post(
          URL,
          { content_id: contentId, stars: Number(stars), comment: comment.trim() },
          { headers }
        );
        setMsg("✅ Reseña publicada.");
        setComment("");
        setStars(5);
      } catch (err2) {
        const status = err2?.response?.status;
        const data = err2?.response?.data;

        setMsg(
          `❌ Error publicando reseña (${status ?? "sin status"}): ${
            (data && (data.detail || data.error || JSON.stringify(data))) ||
            err2?.message ||
            "No se pudo publicar."
          }`
        );

        console.error("Review error:", err2);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Agregar reseña</div>

      <label style={{ display: "block", marginBottom: 6 }}>Calificación</label>
      <select
        value={stars}
        onChange={(e) => setStars(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.18)",
          color: "#fff",
          marginBottom: 12,
        }}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n} style={{ background: "#0b0f1a", color: "#fff" }}>
            {n} ★
          </option>
        ))}
      </select>

      <label style={{ display: "block", marginBottom: 6 }}>Comentario</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Escribe tu opinión…"
        rows={4}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.18)",
          color: "#fff",
          resize: "vertical",
        }}
      />

      {msg ? (
        <div style={{ marginTop: 10, color: msg.startsWith("✅") ? "#b7f7c6" : "#ff6b6b" }}>
          {msg}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 12,
          background: "#ff0000",
          border: 0,
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 12,
          fontWeight: 900,
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Publicando…" : "Publicar reseña"}
      </button>
    </form>
  );
}
