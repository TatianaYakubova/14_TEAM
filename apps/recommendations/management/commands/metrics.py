from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from apps.history.models import UserRating
from apps.recommendations.ml_engine import get_similar_movies_ml
import time

class Command(BaseCommand):
    help = 'Собирает технические метрики, метрики данных и модели'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("=== МОНИТОРИНГ СИСТЕМЫ CINEMATCH ==="))

        # 1. МЕТРИКИ ДАННЫХ (Data Drift)
        total_reviews = Review.objects.count()
        if total_reviews > 0:
            unknown_reviews = Review.objects.filter(sentiment='Unknown').count()
            unknown_ratio = (unknown_reviews / total_reviews) * 100
            self.stdout.write(f"\n1. МЕТРИКИ ДАННЫХ:")
            self.stdout.write(f"   - Всего отзывов: {total_reviews}")
            self.stdout.write(f"   - Ошибок нейросети (Unknown): {unknown_reviews} ({unknown_ratio:.1f}%)")
            
            # УСЛОВИЕ АЛЕРТА
            if unknown_ratio > 20:
                self.stdout.write(self.style.ERROR(f"   🚨 АЛЕРТ: Доля ошибок > 20%! Возможен Data Drift (сленг/другой язык)."))
            else:
                self.stdout.write(self.style.SUCCESS(f"   ✅ Статус: Норма (ошибок < 20%)"))

        # 2. ТЕХНИЧЕСКИЕ МЕТРИКИ (Latency)
        self.stdout.write(f"\n2. ТЕХНИЧЕСКИЕ МЕТРИКИ (Latency):")
        # Замеряем скорость работы ML-модели (TF-IDF)
        users_with_likes = UserRating.objects.filter(rating__gte=7).values_list('user', flat=True).distinct()
        if users_with_likes:
            user_id = users_with_likes[0]
            liked_movies = list(UserRating.objects.filter(user_id=user_id, rating__gte=7).values_list('movie_id', flat=True))
            
            if liked_movies:
                start_time = time.time()
                recommendations = get_similar_movies_ml(liked_movies, limit=10)
                end_time = time.time()
                latency = (end_time - start_time) * 1000 # в миллисекундах
                
                self.stdout.write(f"   - Время генерации рекомендаций (TF-IDF): {latency:.1f} ms")
                if latency > 5000:
                    self.stdout.write(self.style.ERROR(f"   🚨 АЛЕРТ: Latency > 5000ms! Сервер отвечает слишком медленно."))
                else:
                    self.stdout.write(self.style.SUCCESS(f"   ✅ Статус: Норма (ответ < 5000ms)"))

                # 3. МЕТРИКИ МОДЕЛИ (Hit Rate / Overlap)
                self.stdout.write(f"\n3. МЕТРИКИ МОДЕЛИ:")
                self.stdout.write(f"   - Пользователь ID {user_id} лайкнул {len(liked_movies)} фильмов.")
                self.stdout.write(f"   - ML-алгоритм (TF-IDF) подобрал {len(recommendations)} рекомендаций.")
                
                overlap = set(liked_movies) & set([m.id for m in recommendations])
                if overlap:
                    self.stdout.write(self.style.ERROR(f"   ❌ Ошибка: В рекомендации попали уже лайкнутые: {overlap}"))
                else:
                    self.stdout.write(self.style.SUCCESS("   ✅ Рекомендации не дублируют старые лайки (Hit Rate работает корректно)."))
        else:
            self.stdout.write("   Нет пользователей с оценками 7+ для проверки.")

        self.stdout.write(self.style.SUCCESS("\n=== МОНИТОРИНГ ЗАВЕРШЕН ==="))