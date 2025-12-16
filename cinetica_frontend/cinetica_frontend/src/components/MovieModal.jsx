import { useEffect, useMemo, useState } from "react";
import { tmdbDetail, tmdbProviders, getContentDetail, searchTMDB } from "../api";
import ReviewForm from "./ReviewForm"; // si te da error, comenta esta línea
import "./movieModal.css";

const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

const yearFrom = (d) => (d ? String(d).slice(0, 4) : "");
const num = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

function normalizeGenres(x) {
  const g = pick(x?.genres, x?.genre);
  if (Array.isArray(g)) return g;
  if (typeof g === "string" && g.trim()) return [g];
  return [];
}

export default function MovieModal({ open, movie, onClose }) {
  const [detail, setDetail] = useState(null);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(false);

  const tmdbIdFromMovie = useMemo(() => pick(movie?.tmdb_id, movie?.tmdbId), [movie]);

  useEffect(() => {
    if (!open || !movie) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setDetail(null);
      setProviders(null);

      try {
        // 1) Si ya trae tmdb_id -> detalle bonito directo
        let tmdbId = tmdbIdFromMovie;

        // 2) Si viene de Mongo y no trae tmdb_id -> intenta resolverlo por título en TMDB
        if (!tmdbId) {
          const title = pick(movie?.title, movie?.name, "").trim();
          if (title) {
            const s = await searchTMDB(title, 1);
            const first = (s.data?.results || [])[0];
            tmdbId = first?.tmdb_id || first?.id; // por si llega distinto
          }
        }

        // 3) Si logramos tmdb_id -> usamos TMDB para detalle + providers
        if (tmdbId) {
          const d = await tmdbDetail(tmdbId);
          const p = await tmdbProviders(tmdbId, "CO");
          if (!alive) return;
          setDetail(d.data);
          setProviders(p.data);
        } else if (movie?.id) {
          // 4) Último fallback: detalle interno
          const d = await getContentDetail(movie.id);
          if (!alive) return;
          setDetail(d.data);
        } else {
          setDetail(movie);
        }
      } catch (e) {
        console.error(e);
        if (alive) setDetail(movie);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, movie, tmdbIdFromMovie]);

  if (!open) return null;

  const data = detail || movie || {};
  const title = pick(data.title, movie?.title, "Detalle");
  const overview = pick(data.overview, data.synopsis, data.description, movie?.overview, "Sin sinopsis.");
  const rating = pick(data.rating, data.vote_average, data.avg_rating, movie?.rating);
  const r = num(rating);

  const release = pick(data.release_date, data.releaseDate, movie?.release_date);
  const runtime = pick(data.runtime, data.duration, movie?.runtime);

  const poster = pick(
    data.poster,
    movie?.poster,
    movie?.image_route,
    movie?.image,
    movie?.image_url,
    ""
  );

  const backdrop = pick(data.backdrop, movie?.backdrop, "");

  const genres = normalizeGenres(data).slice(0, 8);

  return (
    <div className="mm__backdrop" onMouseDown={onClose}>
      <div className="mm__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mm__hero" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
          <div className="mm__heroShade" />
          <button className="mm__close" onClick={onClose} aria-label="Cerrar">✕</button>

          <div className="mm__content">
            <div className="mm__poster">
              {poster ? <img src={poster} alt={title} /> : <div className="mm__posterFallback">Sin imagen</div>}
            </div>

            <div className="mm__info">
              <h2 className="mm__title">{title}</h2>

              <div className="mm__meta">
                {release ? <span>{yearFrom(release)}</span> : null}
                {runtime ? <><span className="mm__dot">•</span><span>{runtime} min</span></> : null}
                <span className="mm__dot">•</span>
                <span className="mm__badge">★ {r !== null ? r.toFixed(1) : "—"}</span>
              </div>

              {genres.length ? (
                <div className="mm__genres">
                  {genres.map((g) => <span key={g} className="mm__chip">{g}</span>)}
                </div>
              ) : (
                <div className="mm__muted">Géneros no disponibles.</div>
              )}

              <p className="mm__overview">{overview}</p>

              <div className="mm__where">
                <div className="mm__sectionTitle">Dónde ver (CO)</div>

                {loading ? (
                  <div className="mm__muted">Cargando plataformas…</div>
                ) : providers ? (
                  <>
                    {providers?.link ? (
                      <a className="mm__link" href={providers.link} target="_blank" rel="noreferrer">
                        Ver más en TMDB →
                      </a>
                    ) : null}

                    <ProviderRow title="Streaming" items={providers.flatrate} />
                    <ProviderRow title="Renta" items={providers.rent} />
                    <ProviderRow title="Compra" items={providers.buy} />

                    {!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length ? (
                      <div className="mm__muted">TMDB no tiene proveedores para esta película en CO.</div>
                    ) : null}
                  </>
                ) : (
                  <div className="mm__muted">No hay información de plataformas.</div>
                )}
              </div>

              <div className="mm__where">
                <div className="mm__sectionTitle">Reseñas</div>

                {/* Si tu ReviewForm te falla, comenta este bloque */}
                {movie?.id ? (
                  <div className="mm__reviewsBox">
                    <ReviewForm contentId={movie.id} />
                  </div>
                ) : (
                  <div className="mm__muted">Las reseñas se guardan para películas del catálogo (Mongo).</div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ProviderRow({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="pr__row">
      <div className="pr__title">{title}</div>
      <div className="pr__items">
        {items.map((p) => (
          <div key={p.provider_id} className="pr__item" title={p.provider_name}>
            {p.logo ? <img src={p.logo} alt={p.provider_name} /> : <div className="pr__logoFallback" />}
            <span>{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
