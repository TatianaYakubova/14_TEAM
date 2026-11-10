import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User
from apps.reviews.models import Review
from apps.movies.models import Movie
from rest_framework.test import APIClient

# Фикстура для создания тестового фильма
@pytest.fixture
def test_movie(db):
    return Movie.objects.create(
        title="Тестовый фильм",
        release_year=2024,
        genres=["Drama", "Comedy"],
        duration=120
    )

# Тест 1: Проверка ML-модели (предикт)
@pytest.mark.django_db
def test_sentiment_predict(client):
    url = reverse('predict_api') 
    response = client.post(url, data={'text': 'Отличный фильм!'}, content_type='application/json')
    
    assert response.status_code == status.HTTP_200_OK
    assert 'label' in response.json()
    assert response.json()['label'] in ['Positive', 'Negative', 'Neutral']

# Тест 2: Проверка регистрации пользователя
@pytest.mark.django_db
def test_register_user(client):
    url = reverse('register_user') 
    data = {
        'username': 'testuser123',
        'password': 'securepassword123'
    }
    response = client.post(url, data=data, content_type='application/json')
    
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(username='testuser123').exists()

# Тест 3: Проверка, что профиль требует авторизации
@pytest.mark.django_db
def test_profile_unauthorized(client):
    url = reverse('user_profile') 
    response = client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# Тест 4: Проверка сохранения отзыва с привязкой к пользователю
@pytest.mark.django_db
def test_create_review(test_movie):
    # Создаем пользователя
    user = User.objects.create_user(username='reviewer', password='password123')
    
    # ИСПОЛЬЗУЕМ APICLIENT (вместо обычного client)
    api_client = APIClient()
    api_client.force_authenticate(user=user)
    
    # Отправляем отзыв через API
    url = reverse('review-list')
    data = {
        'movie': test_movie.id,
        'text': 'Это просто шедевр!'
    }
    response = api_client.post(url, data=data, content_type='application/json')
    
    # Проверяем, что отзыв создался
    assert response.status_code == status.HTTP_201_CREATED
    assert Review.objects.count() == 1
    
    # Проверяем, что отзыв привязался к пользователю и нейросеть определила тональность
    review = Review.objects.first()
    assert review.user == user
    assert review.sentiment == 'Positive'