import requests
from django.conf import settings

class TMDBService:
    @staticmethod
    def _get(path: str, params=None):
        url = f"{settings.TMDB_API_BASE_URL}{path}"
        params = params or {}
        params["api_key"] = settings.TMDB_API_KEY
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def search_movies(query: str, page: int = 1, language: str = "es-ES"):
        return TMDBService._get("/search/movie", {
            "query": query,
            "page": page,
            "language": language,
            "include_adult": False,
        })

    @staticmethod
    def movie_detail(movie_id: int, language: str = "es-ES"):
        return TMDBService._get(f"/movie/{movie_id}", {"language": language})

    @staticmethod
    def watch_providers(movie_id: int):
        return TMDBService._get(f"/movie/{movie_id}/watch/providers", {})
