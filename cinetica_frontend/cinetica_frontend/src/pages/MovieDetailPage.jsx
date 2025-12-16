import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/Navbar";
import ReviewForm from "../components/ReviewForm";

export default function MovieDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/content/${id}/`)
      .then((r) => setMovie(r.data))
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando...</p>;
  }

  if (!movie) {
    return <p style={{ padding: 20 }}>No se encontró la película.</p>;
  }

  return (
    <div className="layout">
      <Navbar />

      <main className="container">
        <button className="btn" onClick={() => nav("/")}>← Volver</button>

        <div className="detail">
          <div className="detail-poster card">
            <img src={movie.image_route} alt={movie.title} />
          </div>

          <div className="detail-info">
            <h1>{movie.title}</h1>

            <div className="chips">
              <span className="chip">⭐ {movie.calification_general}</span>
              <span className="chip">{movie.release_year}</span>
              <span className="chip">{movie.duration}</span>
            </div>

            <div className="card">
              <h3>Sinopsis</h3>
              <p>{movie.synopsis}</p>
            </div>

            <div className="card">
              <h3>Reseñas</h3>
              {movie.ratings?.length ? (
                movie.ratings.map((r) => (
                  <div key={r.id} className="review">
                    <strong>{r.user}</strong> — {r.stars} ★
                    <p>{r.comment}</p>
                  </div>
                ))
              ) : (
                <p>Aún no hay reseñas.</p>
              )}
            </div>

            <ReviewForm contentId={movie.id} onCreated={load} />
          </div>
        </div>
      </main>
    </div>
  );
}
