import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User

# Тест 1: Проверка ML-модели (предикт)
@pytest.mark.django_db
def test_sentiment_predict(client):
    # Отправляем POST-запрос на наш эндпоинт
    url = reverse('predict_api') # Убедись, что в urls.py есть name='predict_api'
    response = client.post(url, data={'text': 'Отличный фильм!'}, content_type='application/json')
    
    assert response.status_code == status.HTTP_200_OK
    assert 'label' in response.json()
    assert response.json()['label'] in ['Positive', 'Negative', 'Neutral']

# Тест 2: Проверка регистрации пользователя
@pytest.mark.django_db
def test_register_user(client):
    url = reverse('register_user') # Убедись, что в apps/users/urls.py есть name='register_user'
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
    url = reverse('user_profile') # name='user_profile'
    response = client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED