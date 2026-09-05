"""
Trains the three base heatwave-prediction models (Random Forest, XGBoost,
LSTM) on historical daily weather data and persists them to MODEL_DIR.

Run inside the backend container:
    python -m app.services.ml.train
"""
from __future__ import annotations

import os
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app.core.config import get_settings
from app.services.ml.features import (
    FEATURE_COLUMNS,
    SEQUENCE_LENGTH,
    build_tabular_features,
    build_sequence_tensor,
    label_heatwave,
)
from app.services.ml.synthetic_history import generate_synthetic_history

settings = get_settings()


class HeatwaveLSTM(nn.Module):
    def __init__(self, n_features: int, hidden_size: int = 32, num_layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_size, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        last_step = out[:, -1, :]
        return self.head(last_step).squeeze(-1)


def _prepare_dataset(df: pd.DataFrame):
    features_df = build_tabular_features(df)
    labels = label_heatwave(df["temperature_c"])
    return features_df, labels


def train_random_forest(X_train, y_train) -> RandomForestClassifier:
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=settings.RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    return model


def train_xgboost(X_train, y_train) -> XGBClassifier:
    pos = max(int(y_train.sum()), 1)
    neg = max(int(len(y_train) - y_train.sum()), 1)
    model = XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=neg / pos,
        eval_metric="logloss",
        random_state=settings.RANDOM_SEED,
    )
    model.fit(X_train, y_train)
    return model


def train_lstm(sequences: np.ndarray, seq_labels: np.ndarray, epochs: int = 15) -> HeatwaveLSTM:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = HeatwaveLSTM(n_features=sequences.shape[2]).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.BCELoss()

    X = torch.tensor(sequences, dtype=torch.float32).to(device)
    y = torch.tensor(seq_labels, dtype=torch.float32).to(device)

    dataset = torch.utils.data.TensorDataset(X, y)
    loader = torch.utils.data.DataLoader(dataset, batch_size=64, shuffle=True)

    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            preds = model(xb)
            loss = criterion(preds, yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"[LSTM] epoch {epoch + 1}/{epochs} loss={total_loss / max(len(loader),1):.4f}")

    return model


def run_training_pipeline(df: pd.DataFrame | None = None) -> dict:
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    if df is None:
        df = generate_synthetic_history()

    features_df, labels = _prepare_dataset(df)
    X = features_df[FEATURE_COLUMNS].values
    y = labels.values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=settings.RANDOM_SEED, stratify=y
    )

    rf_model = train_random_forest(X_train, y_train)
    xgb_model = train_xgboost(X_train, y_train)

    rf_acc = rf_model.score(X_test, y_test)
    xgb_acc = xgb_model.score(X_test, y_test)

    # LSTM on raw sequences (not the tabular scaled features)
    sequences = build_sequence_tensor(features_df)
    seq_labels = labels.values[SEQUENCE_LENGTH - 1 :]
    lstm_model = train_lstm(sequences, seq_labels[: len(sequences)])

    joblib.dump(rf_model, os.path.join(settings.MODEL_DIR, "random_forest.joblib"))
    joblib.dump(xgb_model, os.path.join(settings.MODEL_DIR, "xgboost.joblib"))
    joblib.dump(scaler, os.path.join(settings.MODEL_DIR, "scaler.joblib"))
    torch.save(lstm_model.state_dict(), os.path.join(settings.MODEL_DIR, "lstm.pt"))

    metrics = {"rf_test_accuracy": rf_acc, "xgb_test_accuracy": xgb_acc}
    print("Training complete:", metrics)
    return metrics


if __name__ == "__main__":
    run_training_pipeline()
