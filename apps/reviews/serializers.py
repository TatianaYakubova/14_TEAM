from rest_framework import serializers
from .models import Review
from apps.movies.models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    movie_title = serializers.ReadOnlyField(source='movie.title')
    
    # Кастомное поле для вывода Имени и Фамилии
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'movie', 'movie_title', 'text', 'sentiment', 'user_name', 'created_at']
        read_only_fields = ['sentiment', 'created_at']

    def get_user_name(self, obj):
        if obj.user:
            # Если пользователь заполнил Имя и Фамилию в профиле - выводим их
            if obj.user.first_name or obj.user.last_name:
                return f"{obj.user.first_name} {obj.user.last_name}".strip()
            # Иначе выводим его логин
            return obj.user.username
        return 'Аноним'