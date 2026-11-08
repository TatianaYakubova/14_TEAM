import logging
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

logger = logging.getLogger(__name__)


@extend_schema(
    summary="Получить или обновить профиль текущего пользователя",
    description="Возвращает информацию о текущем пользователе. При POST/PUT сохраняет изменения.",
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {
                'id': {'type': 'integer'},
                'username': {'type': 'string'},
                'first_name': {'type': 'string'},
                'last_name': {'type': 'string'},
                'age': {'type': 'integer'},
                'preference_vector': {'type': 'object'},
            }},
            description='Профиль пользователя'
        ),
        401: OpenApiResponse(description='Не авторизован')
    }
)
# Разрешаем не только GET, но и POST, PUT, PATCH для сохранения
@api_view(['GET', 'POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Возвращает или обновляет профиль текущего пользователя"""
    try:
        user = request.user
        from apps.users.models import Profile
        # Безопасно получаем или создаем профиль
        profile, _ = Profile.objects.get_or_create(user=user)
        
        # Если фронтенд просто загружает страницу
        if request.method == 'GET':
            pref = profile.preference_vector or {}
            return Response({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'age': pref.get('age', ''), # Достаем возраст из JSON профиля
                'preference_vector': pref,
            })
            
        # Если фронтенд нажал "Сохранить профиль"
        elif request.method in ['POST', 'PUT', 'PATCH']:
            data = request.data
            
            # Обновляем стандартные поля Django
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            user.save()
            
            # Обновляем кастомные поля в Profile (preference_vector)
            pref = profile.preference_vector or {}
            
            if 'age' in data:
                pref['age'] = data['age']
                
            # Жанры могут прийти как список напрямую или внутри preference_vector
            if 'genres' in data:
                pref['genres'] = data['genres']
            elif 'preference_vector' in data and 'genres' in data['preference_vector']:
                pref['genres'] = data['preference_vector']['genres']
                
            profile.preference_vector = pref
            profile.save()
            
            return Response({'status': 'success', 'message': 'Профиль сохранен'})
            
    except Exception as e:
        logger.error(f"[USER PROFILE ERROR] {e}", exc_info=True)
        return Response(
            {'error': 'Ошибка получения или сохранения профиля'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="Обновить предпочтения пользователя",
    description="Обновляет список предпочитаемых жанров текущего пользователя",
    request={
        'type': 'object',
        'properties': {
            'genres': {
                'type': 'array',
                'items': {'type': 'string'},
                'description': 'Список жанров',
                'example': ['Action', 'Comedy', 'Drama']
            }
        },
        'required': ['genres']
    },
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {
                'message': {'type': 'string'},
                'genres': {'type': 'array', 'items': {'type': 'string'}}
            }},
            description='Предпочтения обновлены'
        )
    }
)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    """Обновляет предпочтения текущего пользователя"""
    try:
        genres = request.data.get('genres')
        
        if genres is None or not isinstance(genres, list):
            return Response(
                {'error': 'Поле genres обязательно и должно быть списком'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.users.models import Profile
        profile, _ = Profile.objects.get_or_create(user=request.user)
        
        pref = profile.preference_vector or {}
        pref['genres'] = genres
        profile.preference_vector = pref
        profile.save(update_fields=['preference_vector'])
        
        return Response({'message': 'Предпочтения обновлены', 'genres': genres})
    except Exception as e:
        logger.error(f"[UPDATE PREFERENCES ERROR] {e}", exc_info=True)
        return Response(
            {'error': 'Ошибка обновления предпочтений'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="Регистрация нового пользователя",
    description="Регистрирует нового пользователя в системе",
    request={
        'type': 'object',
        'properties': {
            'username': {'type': 'string', 'description': 'Имя пользователя', 'minLength': 3},
            'password': {'type': 'string', 'description': 'Пароль', 'minLength': 8}
        },
        'required': ['username', 'password']
    },
    responses={
        201: OpenApiResponse(description='Пользователь успешно зарегистрирован'),
        400: OpenApiResponse(description='Неверные данные')
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Регистрация нового пользователя"""
    try:
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({'error': 'Логин и пароль обязательны'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(username) < 3:
            return Response({'error': 'Логин должен содержать минимум 3 символа'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({'error': 'Пароль должен содержать минимум 8 символов'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': f'Пользователь "{username}" уже существует'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=username, password=password)
        
        from apps.users.models import Profile
        Profile.objects.get_or_create(user=user, defaults={'preference_vector': {'genres': []}})
        
        logger.info(f"Зарегистрирован новый пользователь: {username}")
        
        return Response({
            'id': user.id,
            'username': user.username,
            'message': 'Регистрация успешна'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"[REGISTER ERROR] {e}", exc_info=True)
        return Response({'error': 'Ошибка регистрации'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)