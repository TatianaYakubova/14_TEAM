from django.urls import path
from . import views

urlpatterns = [
    # Оставляем как было
    path('me/', views.get_current_user, name='user_profile'),
    
    # ДОБАВЛЯЕМ ВОТ ЭТУ СТРОЧКУ (чтобы фронтенд нашел профиль по /profile/)
    path('profile/', views.get_current_user, name='user_profile_alias'),
    
    path('me/preferences/', views.update_preferences, name='update_preferences'),
    path('register/', views.register_user, name='register_user'),
]