from django.urls import path
from . import views

urlpatterns = [
    # Эндпоинт для личных рекомендаций (мы его оставили)
    path('personal/', views.personal_recommendations, name='personal-recommendations'),
    
    # Эндпоинт для рекомендаций комнаты (он заменил старый consensus)
    path('room/<int:room_id>/', views.room_recommendations, name='room-recommendations'),
]