from django.db import models
from django.contrib.auth.models import AbstractUser


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.name


class User(AbstractUser):
    # AbstractUser ya trae: username, email, password, etc.
    age = models.PositiveIntegerField(null=True, blank=True)
    registration_date = models.DateTimeField(auto_now_add=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)

    class Meta:
        db_table = "users"


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "genres"

    def __str__(self):
        return self.name


class Type(models.Model):
    # Película, Serie, Documental...
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "types"

    def __str__(self):
        return self.name


class AgeRating(models.Model):
    # G, PG-13, R...
    abbreviation = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = "age_ratings"

    def __str__(self):
        return self.abbreviation


class Language(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "languages"

    def __str__(self):
        return self.name


class StreamingSource(models.Model):
    # Netflix, HBO Max, etc.
    name = models.CharField(max_length=255)
    logo_path = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "streaming_sources"

    def __str__(self):
        return self.name


class Content(models.Model):
    # Tu tabla CONTENT
    title = models.CharField(max_length=255)
    type = models.ForeignKey(Type, on_delete=models.PROTECT, related_name="contents")
    age_rating = models.ForeignKey(AgeRating, on_delete=models.PROTECT, related_name="contents")
    release_year = models.IntegerField(null=True, blank=True)
    duration = models.CharField(max_length=20, blank=True)
    image_route = models.CharField(max_length=255, blank=True)
    synopsis = models.TextField(blank=True)
    calification_general = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    updated_at = models.DateField(auto_now=True)

    genres = models.ManyToManyField(Genre, related_name="contents", blank=True)
    languages = models.ManyToManyField(Language, related_name="contents", blank=True)
    streaming_sources = models.ManyToManyField(StreamingSource, related_name="contents", blank=True)

    class Meta:
        db_table = "contents"

    def __str__(self):
        return self.title


class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings")
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name="ratings")
    stars = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    rating_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ratings"
        unique_together = ("user", "content")  # un rating por usuario y contenido

    def __str__(self):
        return f"{self.user.username} → {self.content.title} ({self.stars})"


class UserFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name="favorited_by")

    class Meta:
        db_table = "user_favorites"
        unique_together = ("user", "content")


class UserPreferredGenre(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="preferred_genres")
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, related_name="users_who_prefer")

    class Meta:
        db_table = "user_preferred_genres"
        unique_together = ("user", "genre")
