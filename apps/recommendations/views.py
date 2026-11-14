from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.rooms.models import Room, RoomPurpose
from .services import get_personal_recommendations, get_room_recommendations
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def personal_recommendations(request):
    try:
        limit = int(request.query_params.get('limit', 20))
        movies = get_personal_recommendations(request.user, limit)
        return Response([{'id': m.id, 'title': m.title, 'genres': m.genres, 'imdb_rating': m.imdb_rating} for m in movies])
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_recommendations(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        if request.user not in room.members.all():
            return Response({'error': 'Вы не участник комнаты'}, status=403)

        # Обработка смены цели
        purpose = request.query_params.get('purpose') or request.data.get('purpose')
        if purpose:
            purpose_obj = RoomPurpose.objects.filter(code=purpose).first()
            if purpose_obj and room.purpose != purpose_obj:
                room.purpose = purpose_obj
                room.save(update_fields=['purpose'])
        
        active_purpose = room.purpose.code if room.purpose else 'friendly'
        
        movies = get_room_recommendations(room, purpose=active_purpose, limit=20)
        
        return Response({
            'active_purpose': active_purpose,
            'recommendations': [{'id': m.id, 'title': m.title, 'genres': m.genres, 'imdb_rating': m.imdb_rating} for m in movies]
        })
    except Room.DoesNotExist:
        return Response({'error': 'Комната не найдена'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.reviews.models import Review
from apps.history.models import UserRating

from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.reviews.models import Review
from apps.history.models import UserRating

@api_view(['GET'])
def get_system_metrics(request):
    """Эндпоинт для дашборда мониторинга с проверкой на дрейф данных"""
    
    # 1. Базовые метрики
    total_reviews = Review.objects.count()
    unknown_reviews = Review.objects.filter(sentiment='Unknown').count() if total_reviews > 0 else 0
    unknown_ratio = (unknown_reviews / total_reviews * 100) if total_reviews > 0 else 0
    
    # 2. Определение ДРЕЙФА (Data Drift)
    # Если доля ошибок модели > 15%, значит данные изменились (сленг, другой язык)
    drift_status = "healthy"
    if unknown_ratio > 15:
        drift_status = "DRIFT_DETECTED" # 🚨 Тревога!
        
    # 3. Считаем среднюю длину отзыва (еще один признак дрейфа)
    # Если люди начали писать очень короткие отзывы, это может сломать модель
    avg_length = 0
    if total_reviews > 0:
        # Берем последние 50 отзывов для анализа
        recent_reviews = Review.objects.all().order_by('-created_at')[:50]
        total_len = sum(len(r.text) for r in recent_reviews)
        avg_length = total_len / len(recent_reviews)

    return Response({
        'data_metrics': {
            'total_reviews': total_reviews,
            'unknown_sentiment_ratio': round(unknown_ratio, 2),
            'avg_review_length': round(avg_length, 1), # Средняя длина текста
        },
        'model_metrics': {
            'total_ratings': UserRating.objects.count(),
        },
        'technical_metrics': {
            'status': drift_status, # healthy или DRIFT_DETECTED
        }
    })