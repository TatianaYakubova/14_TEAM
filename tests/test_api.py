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
    user = User.objects.create_user(username='reviewer', password='password123')
    
    api_client = APIClient()
    api_client.force_authenticate(user=user)
    
    url = reverse('review-list')
    data = {
        'movie': test_movie.id,
        'text': 'Это просто шедевр!'
    }
    response = api_client.post(url, data=data, content_type='application/json')
    
    assert response.status_code == status.HTTP_201_CREATED
    assert Review.objects.count() == 1
    
    review = Review.objects.first()
    assert review.user == user
    assert review.sentiment == 'Positive'


# ==========================================
# ТЕСТЫ ДЛЯ ОЦЕНКИ КАЧЕСТВА И УСТОЙЧИВОСТИ МОДЕЛИ
# ==========================================

# 5. Проверка на английском языке (Domain Shift)
@pytest.mark.django_db
def test_subgroup_english_text(client):
    url = reverse('predict_api')
    response = client.post(url, data={'text': 'Amazing movie! I loved it so much.'}, content_type='application/json')
    assert response.status_code == 200

# 6. Проверка на пустую строку
@pytest.mark.django_db
def test_edge_case_empty_string(client):
    url = reverse('predict_api')
    response = client.post(url, data={'text': ''}, content_type='application/json')
    assert response.status_code in [400, 200] 

# 7. Проверка на очень длинный текст
@pytest.mark.django_db
def test_edge_case_very_long_text(client):
    url = reverse('predict_api')
    long_text = "Отличный фильм! " * 500 
    response = client.post(url, data={'text': long_text}, content_type='application/json')
    assert response.status_code == 200

# 8. Проверка на сильный негатив
@pytest.mark.django_db
def test_expected_behavior_strong_negative(client):
    url = reverse('predict_api')
    response = client.post(url, data={'text': 'Ужасный, отвратительный фильм. Худшее, что я видел!'}, content_type='application/json')
    assert response.status_code == 200
    assert response.json()['label'] == 'Negative'