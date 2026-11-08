import random
from collections import defaultdict
from apps.movies.models import Movie
from apps.reviews.models import Review
from apps.users.models import Profile
from apps.history.models import UserRating

# Жанры, которые ограничиваем по возрасту
ADULT_GENRES = ['Horror', 'Thriller', 'Ужасы', 'Триллер']

def build_user_genre_weights(user):
    """
    Строит вектор предпочтений (весов) жанров для одного пользователя.
    Учитывает: профиль + отзывы (NLP) + оценки.
    """
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
                weights[genre] += 0.8  # Сильный сигнал "нравится"
        elif review.sentiment == 'Negative':
            for genre in review.movie.genres:
                weights[genre] -= 1.2  # Штраф за негатив (негатив весит больше)

    # 3. Веса из оценок (если есть UserRating)
    ratings = UserRating.objects.filter(user=user).select_related('movie')
    for rating in ratings:
        if rating.rating >= 7:
            for genre in rating.movie.genres:
                weights[genre] += 0.5
        elif rating.rating <= 3:
            for genre in rating.movie.genres:
                weights[genre] -= 0.5

    return weights, pref.get('age')

def score_movies(genre_weights, min_age, limit=20):
    """
    Считает скор для всех фильмов и возвращает топ-N.
    """
    all_movies = Movie.objects.all()
    scored_movies = []

    for movie in all_movies:
        # Возрастной фильтр (если младше 18 - исключаем ужасы)
        if min_age and int(min_age) < 18:
            if any(g in ADULT_GENRES for g in movie.genres):
                continue

        score = 0.0
        for genre in movie.genres:
            score += genre_weights.get(genre, 0.0)
        
        # Бонус за рейтинг IMDb (чтобы не выдавать полный шлак)
        if movie.imdb_rating:
            score += (movie.imdb_rating / 10.0) * 0.5

        if score > 0:
            scored_movies.append((score, movie))

    scored_movies.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in scored_movies[:limit]]

def get_personal_recommendations(user, limit=20):
    """Персональные рекомендации для одного пользователя"""
    weights, age = build_user_genre_weights(user)
    return score_movies(weights, age, limit)

def get_room_recommendations(room, purpose='friendly', limit=20):
    """
    Групповые рекомендации (Консенсус).
    Учитывает: суммарные веса всех участников + цель комнаты.
    """
    members = room.members.all()
    combined_weights = defaultdict(float)
    min_age = None

    # 1. Собираем веса ВСЕХ участников и суммируем их (Консенсус)
    for member in members:
        member_weights, member_age = build_user_genre_weights(member)
        for genre, weight in member_weights.items():
            combined_weights[genre] += weight
        
        # Ищем самого младшего (для возрастного ограничения)
        if member_age:
            age_int = int(member_age)
            if min_age is None or age_int < min_age:
                min_age = age_int

    # 2. Корректировка под ЦЕЛЬ комнаты (Бустинг жанров)
    if purpose == 'romantic':
        combined_weights['Romance'] += 10.0
        combined_weights['Мелодрама'] += 10.0
        combined_weights['Comedy'] += 2.0 # Романтические комедии
    elif purpose == 'family':
        combined_weights['Animation'] += 10.0
        combined_weights['Family'] += 10.0
        combined_weights['Мультфильм'] += 10.0
    elif purpose == 'horror':
        combined_weights['Horror'] += 10.0
        combined_weights['Ужасы'] += 10.0
    elif purpose == 'educational':
        combined_weights['Documentary'] += 10.0
        combined_weights['History'] += 10.0
    elif purpose == 'true_story':
        combined_weights['Biography'] += 10.0
        combined_weights['History'] += 5.0

    return score_movies(combined_weights, min_age, limit)