from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from apps.history.models import UserRating
from apps.recommendations.ml_engine import get_similar_movies_ml

class Command(BaseCommand):
    help = 'Выводит метрики качества ML-модели и данных'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("=== СБОР МЕТРИК ==="))

        # 1. МЕТРИКА ДАННЫХ: Доля ошибок нейросети (Unknown)
        total_reviews = Review.objects.count()
        if total_reviews > 0:
            unknown_reviews = Review.objects.filter(sentiment='Unknown').count()
            unknown_ratio = (unknown_reviews / total_reviews) * 100
            self.stdout.write(f"1. Всего отзывов: {total_reviews}")
            self.stdout.write(f"   Ошибок (Unknown): {unknown_reviews} ({unknown_ratio:.1f}%)")
            
            if unknown_ratio > 20:
                self.stdout.write(self.style.WARNING("   ⚠️ АЛЕРТ: Доля ошибок > 20%! Возможен дрейф данных."))
        else:
            self.stdout.write("1. Отзывов пока нет.")

        # 2. МЕТРИКА МОДЕЛИ: Hit Rate (Проверяем ML-алгоритм TF-IDF)
        self.stdout.write("\n2. Проверка ML-рекомендаций (Hit Rate):")
        
        # Берем случайного пользователя, у которого есть лайки
        users_with_likes = UserRating.objects.filter(rating__gte=7).values_list('user', flat=True).distinct()
        
        if users_with_likes:
            user_id = users_with_likes[0]
            liked_movies = list(UserRating.objects.filter(user_id=user_id, rating__gte=7).values_list('movie_id', flat=True))
            
            # ВОТ ЗДЕСЬ БЫЛ ЛИШНИЙ ОТСТУП, Я ЕГО УБРАЛ
            if liked_movies:
                self.stdout.write(f"   Пользователь ID {user_id} лайкнул {len(liked_movies)} фильмов.")
                try:
                    recommendations = get_similar_movies_ml(liked_movies, limit=10)
                    self.stdout.write(f"   ML-алгоритм (TF-IDF) подобрал {len(recommendations)} рекомендаций.")
                    
                    overlap = set(liked_movies) & set([m.id for m in recommendations])
                    if overlap:
                        self.stdout.write(self.style.ERROR(f"   ❌ Ошибка: В рекомендации попали уже лайкнутые: {overlap}"))
                    else:
                        self.stdout.write(self.style.SUCCESS("   ✅ Хорошо: Рекомендации не дублируют старые лайки."))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"   ❌ Ошибка в ML-движке: {str(e)}"))
            else:
                self.stdout.write("   У пользователя нет оценок 7+.")
        else:
            self.stdout.write("   Нет пользователей с высокими оценками для проверки.")

        self.stdout.write(self.style.SUCCESS("=== ГОТОВО ==="))