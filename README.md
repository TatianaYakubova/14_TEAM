# 🎬 IMDB Sentiment Analysis

Production-ready ML pipeline для бинарной классификации тональности отзывов на фильмы (IMDB).

## 📌 О проекте

Проект решает задачу **анализа тональности** — определяет, является ли отзыв на фильм положительным или отрицательным. 

**Ключевые особенности:**
- End-to-end пайплайн: от загрузки сырых данных до инференса.
- Воспроизводимость через Poetry и фиксированные версии зависимостей.
- Автоматическая проверка кодстайла через pre-commit (black, ruff, isort).
- Покрытие ключевых модулей unit-тестами.

## 📊 О датасете

**Название:** Neural University IMDB Spring 2019  
**Источник:** [Kaggle Competition](https://www.kaggle.com/competitions/neural-university-imdb-spring2019/data)

**Описание:**  
Датасет содержит 50 000 отзывов на фильмы, размеченных как положительные (1) и отрицательные (0). Данные разделены на 40 000 обучающих и 10 000 тестовых примеров.

**Файлы:**
| Файл | Описание |
|------|----------|
| `imdb_train.npz` | Обучающая выборка (`x` — последовательности, `y` — метки) |
| `imdb_test.npy` | Тестовая выборка (только `x`) |
| `imdb_sampleSubmission.csv` | Пример формата ответа |

**Особенности:**
- Тексты уже токенизированы в числовые последовательности.
- Переменная длина последовательностей (требуется padding).

## 🛠 Технологический стек

- **Python 3.13**
- **Poetry** — управление зависимостями и виртуальным окружением
- **PyTorch** — обучение нейросети (LSTM/RNN)
- **NumPy, Pandas** — работа с данными
- **scikit-learn** — метрики и утилиты
- **Matplotlib, Seaborn** — визуализация
- **pre-commit** — проверка кодстайла (black, ruff, isort)
- **pytest** — тестирование

## 📂 Структура проекта
nlp_sentiment_project/
├── .venv/ # Виртуальное окружение (gitignored)
├── configs/
│ └── config.yaml # Пути и гиперпараметры
├── data/
│ ├── raw/ # Исходные данные (gitignored)
│ └── processed/ # Обработанные данные
├── notebooks/
│ └── 01_eda.ipynb # Исследовательский анализ
├── src/
│ └── nlp_sentiment/
│ ├── data/
│ │ └── loader.py # Загрузка .npz/.npy
│ ├── features/
│ │ └── preprocess.py # Токенизация, padding
│ ├── models/
│ │ ├── train.py # Обучение LSTM
│ │ └── predict.py # Инференс
│ └── utils/
│ ├── config.py # Загрузка config.yaml
│ └── logger.py # Логирование
├── tests/
│ └── test_preprocess.py # Тесты
├── .gitignore
├── .pre-commit-config.yaml
├── pyproject.toml
├── poetry.lock
└── README.md