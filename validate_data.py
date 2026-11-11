import os
import sys
import django
import pandas as pd
import great_expectations as gx

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.movies.models import Movie
from apps.reviews.models import Review

def validate_data():
    print("Загружаем данные из базы...")
    
    # 1. Превращаем данные Django в Pandas DataFrame
    movies_qs = Movie.objects.all().values('id', 'title', 'release_year', 'imdb_rating')
    df_movies = pd.DataFrame(list(movies_qs))
    
    reviews_qs = Review.objects.all().values('id', 'movie_id', 'sentiment', 'user_id')
    df_reviews = pd.DataFrame(list(reviews_qs))

    # 2. Настраиваем Great Expectations
    context = gx.get_context(mode="ephemeral")
    
    # --- ВАЛИДАЦИЯ ФИЛЬМОВ ---
    print("\n--- Проверка таблицы Movies ---")
    source_movies = context.data_sources.add_pandas(name="movies_source")
    asset_movies = source_movies.add_dataframe_asset(name="movies_asset")
    
    batch_definition_movies = asset_movies.add_batch_definition_whole_dataframe("movies_batch")
    batch_movies = batch_definition_movies.get_batch(batch_parameters={"dataframe": df_movies})
    
    suite_movies = context.suites.add(gx.ExpectationSuite(name="movies_suite"))
    validator_movies = context.get_validator(batch=batch_movies, expectation_suite=suite_movies)
    
    # 5 ПРОВЕРОК ДЛЯ ФИЛЬМОВ:
    validator_movies.expect_column_values_to_not_be_null("title")
    validator_movies.expect_column_values_to_be_between("release_year", min_value=1900, max_value=2026)
    validator_movies.expect_column_values_to_be_between("imdb_rating", min_value=0, max_value=10)
    validator_movies.expect_column_values_to_be_unique("id")
    validator_movies.expect_table_row_count_to_be_between(min_value=1, max_value=100000)
    
    results_movies = validator_movies.validate()
    
    # --- ВАЛИДАЦИЯ ОТЗЫВОВ ---
    print("\n--- Проверка таблицы Reviews ---")
    source_reviews = context.data_sources.add_pandas(name="reviews_source")
    asset_reviews = source_reviews.add_dataframe_asset(name="reviews_asset")
    
    batch_definition_reviews = asset_reviews.add_batch_definition_whole_dataframe("reviews_batch")
    batch_reviews = batch_definition_reviews.get_batch(batch_parameters={"dataframe": df_reviews})
    
    suite_reviews = context.suites.add(gx.ExpectationSuite(name="reviews_suite"))
    validator_reviews = context.get_validator(batch=batch_reviews, expectation_suite=suite_reviews)
    
    # 3 ПРОВЕРКИ ДЛЯ ОТЗЫВОВ:
    validator_reviews.expect_column_values_to_be_in_set("sentiment", ["Positive", "Negative", "Neutral", "Unknown"])
    validator_reviews.expect_column_values_to_not_be_null("movie_id")
    validator_reviews.expect_column_values_to_not_be_null("user_id")
    
    results_reviews = validator_reviews.validate()

    # 3. Вывод отчета
    print("\n=== ОТЧЕТ О ВАЛИДАЦИИ ===")
    for name, results in [("Movies", results_movies), ("Reviews", results_reviews)]:
        print(f"\nТаблица: {name}")
        for r in results["results"]:
            exp_type = r['expectation_config'].type
            
            if r["success"]:
                print(f"  ✅ PASSED: {exp_type}")
            else:
                print(f"  ❌ FAILED: {exp_type} | Детали: {r['result']}")

if __name__ == "__main__":
    # Перенаправляем весь вывод в файл
    sys.stdout = open('validation_report.txt', 'w', encoding='utf-8')
    validate_data()
    sys.stdout.close()