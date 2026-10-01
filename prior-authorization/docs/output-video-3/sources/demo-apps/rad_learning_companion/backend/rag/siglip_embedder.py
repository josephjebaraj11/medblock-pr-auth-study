# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from typing import List

import torch
import torch.nn.functional as F
from langchain.embeddings.base import Embeddings
from transformers import AutoModel, AutoTokenizer

HF_TOKEN = os.environ.get("HF_TOKEN", None)


class CustomSigLipEmbeddings(Embeddings):
    """Custom LangChain embedding wrapper for SigLIP models with normalization.

    It inherits from LangChain's `Embeddings` base class, ensuring it
    implements the required `embed_documents` and `embed_query` methods."""

    def __init__(self, siglip_model_name: str, device: str = "cpu", normalize_embeddings: bool = True):
        super().__init__()
        self.tokenizer = AutoTokenizer.from_pretrained(siglip_model_name, token=HF_TOKEN)
        self.model = AutoModel.from_pretrained(siglip_model_name, token=HF_TOKEN).to(device)
        self.device = device
        self.normalize_embeddings = normalize_embeddings

    def _embed(self, texts: List[str]) -> torch.Tensor:
        """Helper function to generate and normalize embeddings."""
        inputs = self.tokenizer(
            texts, padding="max_length", truncation=True, max_length=64, return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)

        if self.normalize_embeddings:
            text_features = F.normalize(text_features, p=2, dim=1)

        return text_features

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate normalized embeddings for a list of documents."""
        return self._embed(texts).cpu().numpy().tolist()

    def embed_query(self, text: str) -> List[float]:
        """Generate a normalized embedding for a single query text."""
        return self._embed([text])[0].cpu().numpy().tolist()
