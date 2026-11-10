from django.core.management.base import BaseCommand
from apps.movies.models import Movie
from deep_translator import GoogleTranslator
import re

class Command(BaseCommand):
    help = 'Переводит названия фильмов и жанры на русский язык'

    def handle(self, *args, **kwargs):
        self.stdout.write("Начинаем перевод названий и жанров...")
        
        # Словарь для жанров
        GENRE_MAP = {
            'Action': 'Боевик', 'Adventure': 'Приключения', 'Animation': 'Мультфильм',
            'Comedy': 'Комедия', 'Crime': 'Криминал', 'Documentary': 'Документальный',
            'Drama': 'Драма', 'Family': 'Семейный', 'Fantasy': 'Фэнтези',
            'History': 'История', 'Horror': 'Ужасы', 'Music': 'Музыка',
            'Mystery': 'Детектив', 'Romance': 'Мелодрама', 'Sci-Fi': 'Фантастика',
            'TV Movie': 'Телефильм', 'Thriller': 'Триллер', 'War': 'Военный',
            'Western': 'Вестерн'
        }

        translator = GoogleTranslator(source='auto', target='ru')
        movies = Movie.objects.all()
        count = 0

        for movie in movies:
            # 1. Работа с жанрами
            raw_genres = movie.genres
            
            # Если жанры пришли как строка (например, "['Action', 'Drama']")
            if isinstance(raw_genres, str):
                raw_genres = re.findall(r"[\w-]+", raw_genres)
            # Если это список, оставляем как есть
            elif not isinstance(raw_genres, list):
                raw_genres = []

            # Переводим жанры
            translated_genres = []
            for genre in raw_genres:
                genre_str = str(genre).strip()
                if genre_str in GENRE_MAP:
                    translated_genres.append(GENRE_MAP[genre_str])
                else:
                    translated_genres.append(genre_str) # Если не нашли, оставляем как есть
            
            # Убираем дубликаты
            translated_genres = list(set(translated_genres))

            # 2. Работа с названием (проверяем, есть ли кириллица)
            title = movie.title
            translated_title = title
            
            if not re.search('[а-яА-ЯёЁ]', title):
                try:
                    translated_title = translator.translate(title)
                except Exception as e:
                    # Если перевод не удался, оставляем оригинал
                    pass
            
            # 3. Сохраняем, если были изменения
            if translated_title != title or translated_genres != movie.genres:
                movie.title = translated_title
                movie.genres = translated_genres
                movie.save(update_fields=['title', 'genres'])
                count += 1
                
                if count % 10 == 0:
                    self.stdout.write(f"Обработано {count} фильмов...")

        self.stdout.write(self.style.SUCCESS(f"Готово! Обновлено {count} фильмов."))