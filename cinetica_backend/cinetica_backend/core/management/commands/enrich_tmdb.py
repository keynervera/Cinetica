from django.core.management.base import BaseCommand
from django.conf import settings
import requests

from core.models import Content  # <- si tu modelo se llama distinto, cámbialo aquí

TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p"

def tmdb_get(path, params=None):
    params = params or {}
    params["api_key"] = getattr(settings, "TMDB_API_KEY", None) or "2df7d52d2bb02e1cf5baaeef52f878a6"
    r = requests.get(f"{TMDB_BASE}{path}", params=params, timeout=15)
    r.raise_for_status()
    return r.json()

def poster_url(p, size="w500"):
    return f"{IMG_BASE}/{size}{p}" if p else ""

class Command(BaseCommand):
    help = "Enriquece películas del catálogo (Mongo) con datos de TMDB: poster, backdrop, overview, rating, genres, tmdb_id"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)
        parser.add_argument("--language", type=str, default="es-ES")

    def handle(self, *args, **opts):
        limit = opts["limit"]
        lang = opts["language"]

        qs = Content.objects.all()[:limit]  # si usas djongo funciona igual
        updated = 0

        for c in qs:
            title = getattr(c, "title", None) or getattr(c, "name", None)
            if not title:
                continue

            # Si ya tiene tmdb_id y ya tiene imagen/sinopsis, lo saltamos
            tmdb_id = getattr(c, "tmdb_id", None)
            has_img = bool(getattr(c, "image_route", "") or getattr(c, "image", "") or getattr(c, "poster", ""))
            has_overview = bool(getattr(c, "synopsis", "") or getattr(c, "overview", ""))

            if tmdb_id and has_img and has_overview:
                continue

            try:
                search = tmdb_get("/search/movie", {
                    "query": title,
                    "language": lang,
                    "include_adult": False,
                    "page": 1
                })
                results = search.get("results") or []
                if not results:
                    self.stdout.write(self.style.WARNING(f"Sin resultados TMDB: {title}"))
                    continue

                best = results[0]
                tid = best.get("id")
                if not tid:
                    continue

                detail = tmdb_get(f"/movie/{tid}", {"language": lang})

                # Campos “seguros”
                overview = detail.get("overview") or best.get("overview") or ""
                vote = detail.get("vote_average") or best.get("vote_average") or None
                poster = poster_url(detail.get("poster_path") or best.get("poster_path"), "w500")
                backdrop = poster_url(detail.get("backdrop_path") or best.get("backdrop_path"), "w1280")
                genres = [g.get("name") for g in (detail.get("genres") or []) if g.get("name")]

                # Guardar en tu modelo sin romper si falta algún campo:
                if hasattr(c, "tmdb_id"):
                    c.tmdb_id = tid

                # Imagen: tú usas image_route en frontend (por lo que vi). Setéalo si existe.
                if hasattr(c, "image_route") and poster:
                    c.image_route = poster
                elif hasattr(c, "image") and poster:
                    c.image = poster

                # Sinopsis
                if hasattr(c, "synopsis") and overview:
                    c.synopsis = overview
                elif hasattr(c, "overview") and overview:
                    c.overview = overview
                elif hasattr(c, "description") and overview:
                    c.description = overview

                # Rating
                if hasattr(c, "rating") and vote is not None:
                    c.rating = vote
                elif hasattr(c, "avg_rating") and vote is not None:
                    c.avg_rating = vote

                # Backdrop (si tienes campo)
                if hasattr(c, "backdrop") and backdrop:
                    c.backdrop = backdrop

                # Géneros (si tienes campo string tipo genre)
                if hasattr(c, "genre") and genres:
                    c.genre = genres[0]

                c.save()
                updated += 1
                self.stdout.write(self.style.SUCCESS(f"OK: {title} -> TMDB {tid}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error con {title}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Terminado. Actualizados: {updated}"))
