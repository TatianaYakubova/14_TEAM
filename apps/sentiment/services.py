import os
import re
import pickle
import logging

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import pymorphy3

logger = logging.getLogger(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MORPH = pymorphy3.MorphAnalyzer()

MAX_LEN = 100
LABELS = {0: 'Neutral', 1: 'Positive', 2: 'Negative'}

# Ленивые глобалы
MODEL = None
WORD2IDX = None


class TextCNN(nn.Module):
    def __init__(self, embedding_matrix, num_classes, kernel_sizes, num_filters, dropout):
        super().__init__()
        self.embedding = nn.Embedding.from_pretrained(
            embedding_matrix, freeze=True, padding_idx=0
        )
        self.convs = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(1, num_filters, (k, embedding_matrix.shape[1])),
                nn.ReLU(),
                nn.Dropout(dropout),
            )
            for k in kernel_sizes
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(num_filters * len(kernel_sizes), num_classes)

    def forward(self, x):
        x = self.embedding(x).unsqueeze(1)
        pooled = []
        for conv in self.convs:
            c = conv(x).squeeze(3)
            pooled.append(F.max_pool1d(c, c.size(2)).squeeze(2))
        cat = self.dropout(torch.cat(pooled, dim=1))
        return self.fc(cat)


def load_model():
    """Ленивая загрузка модели. Вызывается один раз за жизнь процесса."""
    global MODEL, WORD2IDX
    if MODEL is not None:
        return

    base_path = os.path.dirname(os.path.abspath(__file__))

    with open(os.path.join(base_path, 'word2idx.pkl'), 'rb') as f:
        WORD2IDX = pickle.load(f)

    # Матрица-заглушка — load_state_dict её всё равно перезапишет
    num_words = len(WORD2IDX)
    embedding_dim = 300
    embedding_matrix = torch.zeros((num_words, embedding_dim))

    model = TextCNN(embedding_matrix, 3, [2, 3, 4, 5], 128, 0.21)
    state = torch.load(
        os.path.join(base_path, 'model_weights.pth'),
        map_location=DEVICE,
    )
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()

    MODEL = model
    logger.info(
        "Sentiment model loaded: words=%d, dim=%d, device=%s",
        num_words, embedding_dim, DEVICE,
    )


def predict(text: str) -> str:
    """
    Возвращает один из классов: 'Neutral', 'Positive', 'Negative'.
    При любой ошибке возвращает 'Unknown' (не падает наверх).
    """
    try:
        load_model()

        tokens = re.sub(r'[^а-яё\s]', '', str(text).lower()).split()
        lemmas = [MORPH.parse(w)[0].normal_form for w in tokens]

        seq = [WORD2IDX.get(tok, 1) for tok in lemmas][:MAX_LEN]
        if len(seq) < MAX_LEN:
            seq += [0] * (MAX_LEN - len(seq))

        tensor = torch.tensor(seq, dtype=torch.long).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits = MODEL(tensor)
            probs = F.softmax(logits, dim=1).cpu().numpy()[0]
            pred = int(np.argmax(probs))

        return LABELS[pred]
    except Exception:
        logger.exception("Sentiment prediction failed")
        return 'Unknown'