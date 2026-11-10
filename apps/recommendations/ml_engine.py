from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from apps.movies.models import Movie
import numpy as np
import logging

logger = logging.getLogger(__name__)

def get_similar_movies_ml(liked_movie_ids, limit=20):
    if not liked_movie_ids:
        return []

    all_movies = list(Movie.objects.all())
    if not all_movies:
        return []

    # Безопасно собираем жанры (на случай, если они хранятся строкой, а не списком)
    genres_corpus = []
    for movie in all_movies:
        if not movie.genres:
            genres_corpus.append("unknown")
        elif isinstance(movie.genres, list):
            # Если это список (как должно быть)
            genres_corpus.append(" ".join(str(g) for g in movie.genres))
        else:
            # Если это строка (на всякий случай)
            genres_corpus.append(str(movie.genres))

    try:
        tfidf = TfidfVectorizer()
        tfidf_matrix = tfidf.fit_transform(genres_corpus)
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    except Exception as e:
        logger.error(f"Ошибка TF-IDF: {e}")
        return []

    liked_indices = [i for i, movie in enumerate(all_movies) if movie.id in liked_movie_ids]
    if not liked_indices:
        return []

    sim_scores = np.sum(cosine_sim[liked_indices], axis=0)
    movie_indices = np.argsort(sim_scores)[::-1]

    recommendations = []
    for idx in movie_indices:
        movie = all_movies[idx]
        if movie.id not in liked_movie_ids:
            recommendations.append(movie)
        if len(recommendations) >= limit:
            break

    return recommendations