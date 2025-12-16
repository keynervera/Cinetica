from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from core.services.tmdb_service import TMDBService

def img_url(path: str | None, size="w500"):
    if not path:
        return ""
    return f"{settings.TMDB_IMAGE_BASE_URL}/{size}{path}"

@api_view(["GET"])
def tmdb_search(request):
    q = request.GET.get("q", "").strip()
    page = int(request.GET.get("page", "1"))
    if not q:
        return Response({"error": "Parametro q requerido"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = TMDBService.search_movies(q, page=page)
        results = []
        for m in data.get("results", []):
            results.append({
                "source": "tmdb",
                "tmdb_id": m.get("id"),
                "title": m.get("title") or "",
                "overview": m.get("overview") or "",
                "release_date": m.get("release_date") or "",
                "rating": m.get("vote_average"),
                "poster": img_url(m.get("poster_path"), "w500"),
                "backdrop": img_url(m.get("backdrop_path"), "w1280"),
            })
        return Response({
            "page": data.get("page"),
            "total_pages": data.get("total_pages"),
            "results": results
        })
    except Exception as e:
        return Response({"error": "TMDB error", "detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

@api_view(["GET"])
def tmdb_movie_detail(request, movie_id: int):
    try:
        m = TMDBService.movie_detail(movie_id)
        payload = {
            "source": "tmdb",
            "tmdb_id": m.get("id"),
            "title": m.get("title") or "",
            "overview": m.get("overview") or "",
            "release_date": m.get("release_date") or "",
            "runtime": m.get("runtime"),
            "rating": m.get("vote_average"),
            "poster": img_url(m.get("poster_path"), "w500"),
            "backdrop": img_url(m.get("backdrop_path"), "w1280"),
            "genres": [g.get("name") for g in (m.get("genres") or [])],
        }
        return Response(payload)
    except Exception as e:
        return Response({"error": "TMDB detail error", "detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

@api_view(["GET"])
def tmdb_watch_providers(request, movie_id: int):
    country = (request.GET.get("country") or "CO").upper()

    try:
        data = TMDBService.watch_providers(movie_id)
        by_country = (data.get("results") or {}).get(country) or {}

        def pick(section):
            items = (by_country.get(section) or [])
            return [{
                "provider_id": x.get("provider_id"),
                "provider_name": x.get("provider_name"),
                "logo": img_url(x.get("logo_path"), "w92"),
            } for x in items]

        payload = {
            "country": country,
            "link": by_country.get("link") or "",
            "flatrate": pick("flatrate"),
            "rent": pick("rent"),
            "buy": pick("buy"),
        }
        return Response(payload)
    except Exception as e:
        return Response({"error": "TMDB providers error", "detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
