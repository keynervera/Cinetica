from rest_framework import serializers
from .models import (
    Content, Genre, Type, AgeRating,
    Language, StreamingSource, Rating
)
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class ContentSerializer(serializers.ModelSerializer):

    image = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = "__all__"

    def get_image(self, obj):
        if obj.image:
            return obj.image
        return "https://via.placeholder.com/300x450?text=Sin+Imagen"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user
    
class ContentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = "__all__"

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class StreamingSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StreamingSource
        fields = ["id", "name", "logo_path"]


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "user", "stars", "comment", "rating_date"]


class ContentListSerializer(serializers.ModelSerializer):
    """Lo que se ve en las tarjetas del catálogo."""
    class Meta:
        model = Content
        fields = ["id", "title", "image_route", "release_year", "calification_general"]


class ContentDetailSerializer(serializers.ModelSerializer):
    """Detalle de una película."""
    genres = GenreSerializer(many=True)
    streaming_sources = StreamingSourceSerializer(many=True)
    ratings = RatingSerializer(many=True, read_only=True)

    type = serializers.StringRelatedField()
    age_rating = serializers.StringRelatedField()

    class Meta:
        model = Content
        fields = "__all__"
