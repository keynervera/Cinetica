import requests
from django.conf import settings

class CineticaExternalService:

    @staticmethod
    def search_content(query: str):
        response = requests.get(
            f"{settings.CINETICA_EXTERNAL_API_BASE_URL}/search/shows",
            params={"q": query},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
