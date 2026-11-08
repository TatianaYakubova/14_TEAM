from django.db import models
from apps.movies.models import Movie


class Review(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True)
    text = models.TextField()
    sentiment = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Защита от спама: если точно такой же отзыв уже есть, не сохраняем его
        if not self.pk and Review.objects.filter(movie=self.movie, user=self.user, text=self.text).exists():
            return # Просто выходим, ничего не сохраняя

        if not self.sentiment and self.text:
            try:
                from apps.sentiment.services import predict
                self.sentiment = predict(self.text)
            except Exception:
                self.sentiment = 'Unknown'
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review #{self.pk} ({self.sentiment or 'n/a'})"

    def save(self, *args, **kwargs):
        # Заполняем sentiment только если он пуст.
        # Импорт внутри — чтобы не тянуть PyTorch на старте Django.
        if not self.sentiment:
            from apps.sentiment.services import predict
            self.sentiment = predict(self.text)
        super().save(*args, **kwargs)