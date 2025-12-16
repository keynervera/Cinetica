import { useEffect, useMemo, useRef, useState } from "react";
import { getContent, searchTMDB } from "../api";
import MovieModal from "../components/MovieModal";
import "./catalogPro.css";
import "./catalogOverrides.css";


const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

function titleOf(m){ return pick(m?.title, m?.name, "Sin título"); }
function imgOf(m){
  return pick(m?.poster, m?.image_route, m?.image, m?.image_url, m?.imageUrl, "");
}
function ratingOf(m){
  const r = pick(m?.rating, m?.vote_average, m?.avg_rating);
  const n = Number(r);
  return Number.isNaN(n) ? null : n;
}

function Row({ title, items, onPick }) {
  const sc = useRef(null);
  const scroll = (dx) => sc.current?.scrollBy({ left: dx, behavior: "smooth" });

  if (!items?.length) return null;

  return (
    <section className="row">
      <div className="row__head">
        <h3>{title}</h3>
        <div className="row__nav">
          <button onClick={() => scroll(-720)}>‹</button>
          <button onClick={() => scroll(720)}>›</button>
        </div>
      </div>

      <div className="row__track" ref={sc}>
        {items.map((m) => (
          <button key={m.id || m.tmdb_id} className="posterBtn" onClick={() => onPick(m)}>
            <div className="poster">
              {imgOf(m) ? (
                <img
                  src={imgOf(m)}
                  alt={titleOf(m)}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="poster__ph" />
              )}
              <div className="poster__fade" />
              <div className="poster__meta">
                <div className="poster__t">{titleOf(m)}</div>
                <div className="poster__r">★ {ratingOf(m)?.toFixed(1) ?? "—"}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [q, setQ] = useState("");
  const [usingTMDB, setUsingTMDB] = useState(false);
  const [tmdb, setTmdb] = useState({ results: [], page: 1, total_pages: 1 });
  const [tmdbLoading, setTmdbLoading] = useState(false);

  // Filters (solo para Mongo)
  const [f1, setF1] = useState("Todos");
  const [f2, setF2] = useState("Todos");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    setLoading(true);
    getContent()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((e) => { console.error(e); setItems([]); })
      .finally(() => setLoading(false));
  }, []);

  // TMDB search (debounce)
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) {
      setUsingTMDB(false);
      setTmdb({ results: [], page: 1, total_pages: 1 });
      setTmdbLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      setTmdbLoading(true);
      try {
        const r = await searchTMDB(s, 1);
        setTmdb(r.data);
        setUsingTMDB(true);
      } catch (e) {
        console.error(e);
        setUsingTMDB(true);
        setTmdb({ results: [], page: 1, total_pages: 1 });
      } finally {
        setTmdbLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [q]);

  const loadMoreTMDB = async () => {
    const s = q.trim();
    if (!s) return;
    if (tmdbLoading) return;
    if ((tmdb.page || 1) >= (tmdb.total_pages || 1)) return;

    setTmdbLoading(true);
    try {
      const nextPage = (tmdb.page || 1) + 1;
      const r = await searchTMDB(s, nextPage);
      setTmdb((prev) => ({
        ...r.data,
        results: [...(prev.results || []), ...(r.data.results || [])],
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setTmdbLoading(false);
    }
  };

  const pickMovie = (m) => {
    setPicked(m);
    setModalOpen(true);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.reload();
  };

  // Mongo filtering
  const mongoFiltered = useMemo(() => {
    let list = items;

    if (f1 !== "Todos") {
      list = list.filter((m) => (m.type || m.content_type || "Todos") === f1);
    }

    if (f2 !== "Todos") {
      const wanted = f2.toLowerCase();

      list = list.filter((m) => {
        // 1) genre como string (ej: "Acción, Terror" o "Horror")
        if (typeof m.genre === "string") {
          return m.genre.toLowerCase().includes(wanted) ||
                (wanted === "terror" && m.genre.toLowerCase().includes("horror"));
        }

        // 2) genres como array (["Horror", "Drama"] o [{name:"Horror"}])
        if (Array.isArray(m.genres)) {
          return m.genres.some((g) => {
            const name = (typeof g === "string" ? g : g?.name || "").toLowerCase();
            return name.includes(wanted) || (wanted === "terror" && name.includes("horror"));
          });
        }

        return false;
      });
    }



    return list;
  }, [items, f1, f2]);

  const featured = useMemo(() => {
    const copy = [...mongoFiltered];
    copy.sort((a, b) => (ratingOf(b) || 0) - (ratingOf(a) || 0));
    return copy.slice(0, 14);
  }, [mongoFiltered]);

  const recent = useMemo(() => {
    const copy = [...mongoFiltered];
    copy.sort((a, b) => String(b.release_date || "").localeCompare(String(a.release_date || "")));
    return copy.slice(0, 14);
  }, [mongoFiltered]);

  const listToShow = usingTMDB ? (tmdb.results || []) : mongoFiltered;

  return (
    <div className="cp">
      <header className="cp__top">
        {/* CINETICA botón */}
        <button
          className="cp__brandBtn"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setQ("");
            setUsingTMDB(false);
            setTmdb({ results: [], page: 1, total_pages: 1 });
          }}
          title="Volver al inicio"
        >
          <div className="cp__logo">🎬</div>
          <div className="cp__name">CINETICA</div>
        </button>

        <div className="cp__controls">
          <div className="cp__searchWrap">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="cp__search"
              placeholder="Buscar película (Batman, Spiderman...)"
            />
            <span className={`cp__chip ${usingTMDB ? "cp__chip--tmdb" : ""}`}>
              {usingTMDB ? "TMDB" : "Mongo"}
            </span>
          </div>

          <select className="cp__select" value={f1} onChange={(e) => setF1(e.target.value)} disabled={usingTMDB}>
            <option value="Todos">Todos</option>
            <option value="Movie">Movie</option>
            <option value="Series">Series</option>
          </select>

          <select className="cp__select" value={f2} onChange={(e) => setF2(e.target.value)} disabled={usingTMDB}>
            <option value="Todos">Todos</option>
            <option value="Acción">Acción</option>
            <option value="Drama">Drama</option>
            <option value="Terror">Terror</option>
            <option value="Comedia">Comedia</option>
          </select>

          <button className="cp__btn" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="cp__main">
        {loading ? (
          <div className="cp__state">Cargando catálogo…</div>
        ) : usingTMDB ? (
          <>
            <div className="cp__sectionTitle">
              Resultados TMDB para: <b>{q.trim()}</b>
            </div>

            <div className="cp__grid">
              {listToShow.map((m) => (
                <button key={m.tmdb_id} className="cardBtn" onClick={() => pickMovie(m)}>
                  <div className="card">
                    {imgOf(m) ? (
                      <img
                        src={imgOf(m)}
                        alt={titleOf(m)}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="card__ph">Sin imagen</div>
                    )}
                    <div className="card__foot">
                      <div className="card__t">{titleOf(m)}</div>
                      <div className="card__r">★ {ratingOf(m)?.toFixed(1) ?? "—"}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
              <button
                className="cp__btn"
                onClick={loadMoreTMDB}
                disabled={tmdbLoading || (tmdb.page >= tmdb.total_pages)}
              >
                {tmdbLoading ? "Cargando…" : (tmdb.page >= tmdb.total_pages ? "No hay más" : "Cargar más")}
              </button>
            </div>
          </>
        ) : (
          <>
            <Row title="Destacadas" items={featured} onPick={pickMovie} />
            <Row title="Estrenos y recientes" items={recent} onPick={pickMovie} />

            <div className="cp__sectionTitle">Todo el catálogo</div>

            <div className="cp__grid">
  {listToShow.map((m) => (
    <button key={m.id || m.tmdb_id} className="cardBtn" onClick={() => pickMovie(m)}>
      <div className="card">
        {imgOf(m) ? (
          <img
            src={imgOf(m)}
            alt={titleOf(m)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="card__ph">Sin imagen</div>
        )}

        <div className="card__foot">
          <div className="card__t">{titleOf(m)}</div>
          <div className="card__r">★ {ratingOf(m)?.toFixed(1) ?? "—"}</div>
        </div>
      </div>
    </button>
  ))}
</div>

          </>
        )}
      </main>

      <MovieModal open={modalOpen} movie={picked} onClose={() => setModalOpen(false)} />
    </div>
  );
}
