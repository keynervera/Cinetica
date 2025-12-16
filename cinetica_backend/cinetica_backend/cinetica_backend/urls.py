"""
URL configuration for cinetica_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.views import (
    ContentListView,
    ContentDetailView,
    RatingCreateView,

)



from core.views_external import (
    search_external_content,
    save_external_content_view,
    list_external_content_view,
    external_content_detail_view,
)
from core.views import RegisterView
from rest_framework.routers import DefaultRouter
from core.views import ContentAdminViewSet
from core.views_external import search_external_content
from core.views_external import save_external_content_view
from core.views_tmdb import tmdb_search
from core.views_tmdb import tmdb_search, tmdb_movie_detail, tmdb_watch_providers





router = DefaultRouter()
router.register(r"admin/content", ContentAdminViewSet, basename="admin-content")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/tmdb/search/", tmdb_search),
    path("api/tmdb/movie/<int:movie_id>/", tmdb_movie_detail),
    path("api/tmdb/movie/<int:movie_id>/providers/", tmdb_watch_providers),



    # Auth
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Catálogo interno
    path("api/content/", ContentListView.as_view(), name="content-list"),
    path("api/content/<int:pk>/", ContentDetailView.as_view(), name="content-detail"),
    path(
        "api/content/<int:content_id>/ratings/",
        RatingCreateView.as_view(),
        name="rating-create",
    ),

    # 🔹 API EXTERNA (TVMaze)
    path("api/external/search/", search_external_content),   # consumir API externa
    path("api/external/save/", save_external_content_view), # guardar en Mongo
    path("api/external/", list_external_content_view),      # listar Mongo
    path("api/external/<str:doc_id>/", external_content_detail_view),  # GET / PUT / DELETE
] + router.urls

