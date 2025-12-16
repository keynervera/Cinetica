from django.contrib import admin
from .models import (
    Role, User, Genre, Type, AgeRating,
    Language, StreamingSource, Content,
    Rating, UserFavorite, UserPreferredGenre
)

admin.site.register(Role)
admin.site.register(User)
admin.site.register(Genre)
admin.site.register(Type)
admin.site.register(AgeRating)
admin.site.register(Language)
admin.site.register(StreamingSource)
admin.site.register(Content)
admin.site.register(Rating)
admin.site.register(UserFavorite)
admin.site.register(UserPreferredGenre)
