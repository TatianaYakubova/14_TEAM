import random
from collections import defaultdict
from apps.movies.models import Movie
from apps.reviews.models import Review
from apps.users.models import Profile
from apps.history.models import UserRating

# Жанры, которые ограничиваем по возрасту (жесткий фильтр, так как это безопасность)
ADULT_GENRES = ['Ужасы', 'Триллер']

# МЯГКИЕ ПРАВИЛА: Веса, которые добавляются жанрам в зависимости от цели комнаты
PURPOSE_BOOSTS = {
    'family': {'Мультфильм': 5.0, 'Семейный': 5.0, 'Комедия': 2.0, 'Приключения': 2.0, 'Фэнтези': 2.0},
    'romantic': {'Мелодрама': 5.0, 'Драма': 2.0, 'Комедия': 2.0},
    'horror': {'Ужасы': 5.0, 'Триллер': 3.0, 'Детектив': 2.0},
    'educational': {'Документальный': 5.0, 'История': 3.0, 'Мультфильм': 2.0},
    'true_story': {'Биография': 5.0, 'История': 3.0, 'Драма': 2.0},
    'solo': {'Драма': 3.0, 'Комедия': 3.0, 'Мелодрама': 3.0},
    'friendly': {'Комедия': 4.0, 'Боевик': 4.0, 'Приключения': 3.0, 'Фэнтези': 3.0, 'Фантастика': 3.0}
}

def build_user_genre_weights(user):
    """Строит вектор предпочтений (весов) жанров для одного пользователя."""
    profile, _ = Profile.objects.get_or_create(user=user)
    pref = profile.preference_vector or {}
    weights = defaultdict(float)

    # 1. Веса из профиля (выбор пользователя)
    for genre in pref.get('genres', []):
        weights[genre] += 1.0

    # 2. Веса из отзывов (наша ML-модель анализа тональности)
    user_reviews = Review.objects.filter(user=user).select_related('movie')
    for review in user_reviews:
        if review.sentiment == 'Positive':
            for genre in review.movie.genres:
                weights[genre] += 0.8
        elif review.sentiment == 'Negative':
            for genre in review.movie.genres:
                weights[genre] -= 1.2

    # 3. Веса из оценок
    ratings = UserRating.objects.filter(user=user).select_related('movie')
    for rating in ratings:
        if rating.rating >= 7:
            for genre in rating.movie.genres:
                weights[genre] += 0.5
        elif rating.rating <= 3:
            for genre in rating.movie.genres:
                weights[genre] -= 0.5

    return weights, pref.get('age')

def score_movies(base_weights, min_age, purpose_boosts=None, limit=20):
    """Считает итоговый скор фильмов, складывая предпочтения и бонусы за цель."""
    all_movies = Movie.objects.all()
    scored_movies = []

    for movie in all_movies:
        # Жесткий фильтр только по возрасту
        if min_age and int(min_age) < 18:
            if any(g in ADULT_GENRES for g in movie.genres):
                continue

        score = 0.0
        
        for genre in movie.genres:
            # Добавляем баллы за личные предпочтения и отзывы
            score += base_weights.get(genre, 0.0)
            
            # Добавляем баллы за соответствие цели комнаты (Soft Boost)
            if purpose_boosts and genre in purpose_boosts:
                score += purpose_boosts[genre]

        # Добавляем бонус за высокий рейтинг IMDb
        if movie.imdb_rating:
            score += (movie.imdb_rating / 10.0) * 0.5

        # Если фильм набрал хоть какие-то баллы, он попадает в список
        if score > 0:
            scored_movies.append((score, movie))

    # Сортируем по убыванию баллов
    scored_movies.sort(key=lambda x: x[0], reverse=True)
    
    # Берем топ-N
    top_movies = [m[1] for m in scored_movies[:limit]]
    
    # Если фильмов не хватило (например, в базе всего 10 штук), добиваем случайными
    if len(top_movies) < limit:
        remaining = Movie.objects.exclude(id__in=[m.id for m in top_movies]).order_by('?')[:limit - len(top_movies)]
        top_movies.extend(remaining)

    return top_movies

def get_personal_recommendations(user, limit=20):
    """Персональные рекомендации (без цели комнаты)"""
    weights, age = build_user_genre_weights(user)
    return score_movies(weights, age, purpose_boosts=None, limit=limit)

def get_room_recommendations(room, purpose='friendly', limit=20):
    """Групповые рекомендации (Консенсус + Мягкий буст по цели)"""
    members = room.members.all()
    combined_weights = defaultdict(float)
    min_age = None

    # 1. Суммируем предпочтения ВСЕХ участников
    for member in members:
        member_weights, member_age = build_user_genre_weights(member)
        for genre, weight in member_weights.items():
            combined_weights[genre] += weight
        
        if member_age:
            age_int = int(member_age)
            if min_age is None or age_int < min_age:
                min_age = age_int

    # 2. Получаем словарь бустов для выбранной цели
    purpose_boosts = PURPOSE_BOOSTS.get(purpose, {})

    # 3. Считаем общий скор
    return score_movies(combined_weights, min_age, purpose_boosts=purpose_boosts, limit=limit)