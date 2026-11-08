import os
import json
import re
import pickle
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import pymorphy3
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MORPH = pymorphy3.MorphAnalyzer()
MODEL = None
WORD2IDX = None

class TextCNN(nn.Module):
    def __init__(self, embedding_matrix, num_classes, kernel_sizes, num_filters, dropout):
        super(TextCNN, self).__init__()
        self.embedding = nn.Embedding.from_pretrained(embedding_matrix, freeze=True, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(1, num_filters, (k, embedding_matrix.shape[1])),
                nn.ReLU(),
                nn.Dropout(dropout)
            ) for k in kernel_sizes
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(num_filters * len(kernel_sizes), num_classes)

    def forward(self, x):
        x = self.embedding(x).unsqueeze(1)
        pooled_outs = []
        for conv in self.convs:
            c = conv(x).squeeze(3)
            mp = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled_outs.append(mp)
        cat = torch.cat(pooled_outs, dim=1)
        cat = self.dropout(cat)
        return self.fc(cat)

def load_model():
    global MODEL, WORD2IDX
    if MODEL is not None:
        return
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(base_path, 'word2idx.pkl'), 'rb') as f:
            WORD2IDX = pickle.load(f)
        embedding_matrix = torch.zeros((len(WORD2IDX), 300))
        MODEL = TextCNN(embedding_matrix, 3, [2, 3, 4, 5], 128, 0.21)
        state = torch.load(os.path.join(base_path, 'model_weights.pth'), map_location=DEVICE)
        MODEL.load_state_dict(state)
        MODEL.to(DEVICE)
        MODEL.eval()
    except Exception as e:
        print(f"Ошибка загрузки модели: {e}")

def predict(text):
    if MODEL is None:
        load_model()
    tokens = re.sub(r'[^а-яё\s]', '', str(text).lower()).split()
    tokens_lemma = [MORPH.parse(w)[0].normal_form for w in tokens]
    seq = [WORD2IDX.get(tok, 1) for tok in tokens_lemma][:100]
    if len(seq) < 100:
        seq += [0] * (100 - len(seq))
    tensor = torch.tensor(seq).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        output = MODEL(tensor)
        probs = F.softmax(output, dim=1).cpu().numpy()[0]
        pred_class = int(np.argmax(probs))
    labels = {0: 'Neutral', 1: 'Positive', 2: 'Negative'}
    return labels[pred_class]

# --- ВОТ ЭТИХ ФУНКЦИЙ НЕ ХВАТАЛО ---
def index_view(request):
    return HttpResponse("OK")

def sentiment_page(request):
    return HttpResponse("Sentiment Page")
# -----------------------------------

@csrf_exempt
def predict_api(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        text = data.get('text', '')
        result = predict(text)
        return JsonResponse({"label": result})
    return JsonResponse({"error": "Method not allowed"}, status=405)