from rest_framework import serializers
from .models import Review
from apps.movies.models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    movie_title = serializers.ReadOnlyField(source='movie.title')

    class Meta:
        model = Review
        fields = ['id', 'movie', 'movie_title', 'text', 'sentiment', 'created_at']
        read_only_fields = ['sentiment', 'created_at']