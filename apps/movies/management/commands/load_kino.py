import csv
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

class Command(BaseCommand):
    help = 'Загружает фильмы из датасета MTS KION (items.csv)'

    def handle(self, *args, **kwargs):
        # Укажите путь к вашему файлу items.csv
        # Если файл лежит в корне проекта, просто напишите 'items.csv'
        file_path = 'items.csv' 
        
        self.stdout.write("Начинаем загрузку фильмов из KION...")
        count = 0
        
        with open(file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # В датасете KION поля могут называться по-разному, 
                # поэтому мы ищем нужные и приводим их к нашему формату
                title = row.get('title') or row.get('name')
                if not title:
                    continue
                    
                try:
                    year = int(row.get('year', 0))
                except ValueError:
                    year = None
                
                # Жанры в датасете могут быть строкой через запятую
                genres_str = row.get('genres', '')
                genres = [g.strip() for g in genres_str.split(',')] if genres_str else []
                
                # Создаем или обновляем фильм (по названию и году)
                Movie.objects.get_or_create(
                    title=title,
                    release_year=year,
                    defaults={
                        'genres': genres,
                        'imdb_rating': None, # В этом датасете может не быть рейтинга
                        'duration': None,
                    }
                )
                count += 1
                if count % 100 == 0:
                    self.stdout.write(f"Загружено {count} фильмов...")
        
        self.stdout.write(self.style.SUCCESS(f"Готово! Загружено {count} фильмов."))