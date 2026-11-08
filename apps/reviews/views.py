from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import serializers

from .models import Review
from .serializers import ReviewSerializer
from apps.movies.models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'

class MovieViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Сохраняем отзыв, тональность вычислится в модели
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    def get_queryset(self):
        queryset = super().get_queryset()
        movie_id = self.request.query_params.get('movie', None)
        if movie_id is not None:
            queryset = queryset.filter(movie_id=movie_id)
        return queryset

    def create(self, request, *args, **kwargs):
        movie_id = request.data.get('movie')
        
        # Проверка, что пользователь уже оставлял отзыв
        if request.user.is_authenticated:
            if Review.objects.filter(user=request.user, movie_id=movie_id).exists():
                return Response(
                    {"error": "Вы уже оставили отзыв к этому фильму"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 3. Сохраняем ОДИН раз, привязывая к пользователю
        user = request.user if request.user.is_authenticated else None
        serializer.save(user=user) 
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)