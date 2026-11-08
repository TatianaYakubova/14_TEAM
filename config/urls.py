from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

# Импортируем наши ViewSet'ы для API
from apps.reviews.views import MovieViewSet, ReviewViewSet

# Импортируем функции для HTML-страниц
from apps.sentiment.views import index_view, sentiment_page, predict_api

# --- Настройка API через роутер ---
router = DefaultRouter()
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    # --- Старые API ---
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/users/', include('apps.users.urls')),
    path('api/movies/', include('apps.movies.urls')),
    path('api/rooms/', include('apps.rooms.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),
    path('api/history/', include('apps.history.urls')),

    # --- Новый API v1 (для React) ---
    path('api/v1/', include(router.urls)),

    # --- Наши HTML-страницы (для Django) ---
    path('', index_view, name='index'),
    path('sentiment/', sentiment_page, name='sentiment'),
    path('api/sentiment/predict/', predict_api, name='predict_api'),
]