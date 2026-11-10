from django.core.management.base import BaseCommand
from apps.movies.models import Movie

class Command(BaseCommand):
    help = 'Принудительно меняет английские жанры на русские'

    def handle(self, *args, **kwargs):
        self.stdout.write("Начинаем замену жанров на русские...")
        
        # Словарь перевода
        GENRE_MAP = {
            'Action': 'Боевик',
            'Adventure': 'Приключения',
            'Animation': 'Мультфильм',
            'Comedy': 'Комедия',
            'Crime': 'Криминал',
            'Documentary': 'Документальный',
            'Drama': 'Драма',
            'Family': 'Семейный',
            'Fantasy': 'Фэнтези',
            'History': 'История',
            'Horror': 'Ужасы',
            'Music': 'Музыка',
            'Mystery': 'Детектив',
            'Romance': 'Мелодрама',
            'Sci-Fi': 'Фантастика',
            'TV Movie': 'Телефильм',
            'Thriller': 'Триллер',
            'War': 'Военный',
            'Western': 'Вестерн'
        }

        movies = Movie.objects.all()
        updated_count = 0

        for movie in movies:
            if not movie.genres:
                continue
                
            # Перебираем жанры фильма и меняем их по словарю
            new_genres = []
            changed = False
            for genre in movie.genres:
                if genre in GENRE_MAP:
                    new_genres.append(GENRE_MAP[genre])
                    changed = True
                else:
                    new_genres.append(genre) # Если жанра нет в словаре, оставляем как есть
            
            if changed:
                movie.genres = new_genres
                movie.save(update_fields=['genres'])
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(f"Готово! Обновлено {updated_count} фильмов."))