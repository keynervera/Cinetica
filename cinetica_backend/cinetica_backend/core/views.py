from rest_framework import generics, permissions
from .models import Content, Rating
from .serializers import (
    ContentListSerializer,
    ContentDetailSerializer,
    RatingSerializer,
)
from rest_framework import generics, permissions
from .serializers import RegisterSerializer
from rest_framework import viewsets
from .serializers import ContentWriteSerializer
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.models import Rating, Content
from core.serializers import RatingSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class ContentAdminViewSet(viewsets.ModelViewSet):
    queryset = Content.objects.all()
    serializer_class = ContentWriteSerializer
    permission_classes = [IsAdminUser]


class ContentListView(generics.ListAPIView):
    """
    Lista de películas para el catálogo.
    GET /api/content/
    """
    queryset = Content.objects.all().order_by("-updated_at")
    serializer_class = ContentListSerializer
    permission_classes = [permissions.AllowAny]


class ContentDetailView(generics.RetrieveAPIView):
    """
    Detalle de película.
    GET /api/content/<id>/
    """
    queryset = Content.objects.all()
    serializer_class = ContentDetailSerializer
    permission_classes = [permissions.AllowAny]


class RatingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            content_id = request.data.get("content")
            stars = request.data.get("stars")
            comment = request.data.get("comment", "")

            if not content_id or not stars:
                return Response(
                    {"error": "Faltan datos"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            content = Content.objects.get(id=content_id)

            rating = Rating.objects.create(
                user=request.user,
                content=content,
                stars=stars,
                comment=comment
            )

            return Response(
                RatingSerializer(rating).data,
                status=status.HTTP_201_CREATED
            )

        except Content.DoesNotExist:
            return Response(
                {"error": "Contenido no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {"error": "Error al guardar reseña"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
