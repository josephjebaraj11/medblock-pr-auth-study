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

import json
import logging
import uuid

import requests

from case_util import get_json_from_model_response
from models import ClinicalMCQ
from prompts import mcq_prompt_all_questions_with_rag
from abc import ABC, abstractmethod
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

class LLMClient(ABC):
    _api_key = None
    _endpoint_url = None

    def generate_all_questions(self, case_data: dict, guideline_context: str) -> list[ClinicalMCQ] | None:
        """
            Orchestrates the prompt creation and live LLM call to generate the list of all MCQs.
            Receives pre-fetched RAG context as a string.
            """
        # 1. Create the prompt messages payload
        messages = self._create_prompt_messages_for_all_questions(
            image_url=case_data.get('download_image_url'),
            ground_truth_labels=case_data.get('ground_truth_labels', {}),
            guideline_context=guideline_context  # Pass the pre-fetched context
        )

        try:
            # 2. Make the API call
            response_dict = self._make_chat_completion_request(
                model="tgi",  # Or your configured model
                messages=messages,
                temperature=0,
                max_tokens=8192
            )

            # 3. Safely access the list of questions from the parsed dictionary
            list_of_question_dicts = response_dict.get("questions", [])

            if not list_of_question_dicts:
                raise ValueError("LLM response did not contain a 'questions' key or the list was empty.")

            # 4. Loop through the extracted list and create ClinicalMCQ objects
            list_clinical_mcq = []
            for question_dict in list_of_question_dicts:
                if "question" not in question_dict:
                    logger.warning("Skipping malformed question object in response.")
                    continue

                mcq_uuid = str(uuid.uuid4())
                clinical_mcq = ClinicalMCQ(
                    id=mcq_uuid,
                    question=question_dict.get('question', ''),
                    choices=question_dict.get('choices', {}),
                    hint=question_dict.get('hint', ''),
                    answer=question_dict.get('answer', ''),
                    rationale=question_dict.get('rationale', '')
                )
                list_clinical_mcq.append(clinical_mcq)

            return list_clinical_mcq

        except Exception as e:
            logger.error(f"Failed to generate and parse learning module: {e}")
            return None

    @abstractmethod
    def _make_chat_completion_request(
        self,
        model: str,
        messages: list,
        temperature: float,
        max_tokens: int,
        top_p: float | None = None,
        seed: int | None = None,
        stop: list[str] | str | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None
    ) -> dict | None:
        pass

    def _create_prompt_messages_for_all_questions(self, image_url: str, ground_truth_labels: dict, guideline_context: str):
        """
        Creates the list of messages for the LLM prompt.
        Dynamically selects the prompt and constructs the payload based on whether RAG context is present.
        """
        # The system message sets the stage and provides all instructions/examples.
        system_message = {
            "role": "system",
            "content": [
                {"type": "text", "text": mcq_prompt_all_questions_with_rag},
            ]
        }

        user_content_text = (
            f"<significant_clinical_conditions>\n{json.dumps(ground_truth_labels, indent=2)}\n</significant_clinical_conditions>\n\n"
            f"<guideline_context>\n{guideline_context}\n</guideline_context>"
        )

        # The user message provides the specific data for THIS request and the image.
        user_message = {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": user_content_text}
            ]
        }

        messages = [system_message, user_message]
        logger.info("Messages being sent:-\n{}".format(json.dumps(messages, indent=2)))
        return messages

class HuggingFaceLLMClient(LLMClient):

    def __init__(self, _api_key, _endpoint_url):
        if not _api_key:
            raise ValueError("No API key provided.")
        if not _endpoint_url:
            raise ValueError("No endpoint URL provided.")

        self._api_key = _api_key
        self._endpoint_url = _endpoint_url

    def _make_chat_completion_request(
        self,
        model: str,
        messages: list,
        temperature: float,
        max_tokens: int,
        top_p: float | None = None,
        seed: int | None = None,
        stop: list[str] | str | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None
    ) -> dict | None:

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if top_p is not None: payload["top_p"] = top_p
        if seed is not None: payload["seed"] = seed
        if stop is not None: payload["stop"] = stop
        if frequency_penalty is not None: payload["frequency_penalty"] = frequency_penalty
        if presence_penalty is not None: payload["presence_penalty"] = presence_penalty

        temp_url = self._endpoint_url.rstrip('/')
        if temp_url.endswith("/v1/chat/completions"):
            full_url = temp_url
        elif temp_url.endswith("/v1"):
            full_url = temp_url + "/chat/completions"
        else:
            full_url = temp_url + "/v1/chat/completions"

        response = requests.post(full_url, headers=headers, json=payload, timeout=60)

        logger.info(f"LLM call status code: {response.status_code}, response: {response.reason}")
        explanation_parts = []
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith('data: '):
                    json_data_str = decoded_line[len('data: '):].strip()
                    if json_data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(json_data_str)
                        if chunk.get("choices") and chunk["choices"][0].get(
                            "delta") and chunk["choices"][0]["delta"].get(
                            "content"):
                            explanation_parts.append(
                                chunk["choices"][0]["delta"]["content"])
                    except json.JSONDecodeError:
                        logger.warning(
                            f"Could not decode JSON from stream chunk: {json_data_str}")
                        # Depending on API, might need to handle partial JSON or other errors
                elif decoded_line.strip() == "[DONE]":  # Some APIs might send [DONE] without "data: "
                    break

        explanation = "".join(explanation_parts).strip()
        if not explanation:
            logger.warning("Empty explanation from API")
        return get_json_from_model_response(explanation)

class VertexAILLMClient(LLMClient):

    def __init__(self, _api_key, _endpoint_url):
        if not _api_key:
            raise ValueError("No API key provided.")
        if not _endpoint_url:
            raise ValueError("No endpoint URL provided.")

        self._api_key = _api_key
        self._endpoint_url = _endpoint_url

    def _make_chat_completion_request(
        self,
        model: str,
        messages: list,
        temperature: float,
        max_tokens: int,
        top_p: float | None = None,
        seed: int | None = None,
        stop: list[str] | str | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None
    ) -> dict | None:

        # 1. Get credentials directly from the secret
        creds = self._get_credentials_from_secret()
        logger.info("Successfully loaded credentials from secret.")

        # 2. Get a valid access token
        token = self._get_access_token(creds)
        logger.info("Successfully obtained access token.")

        # 3. Use the token to make an authenticated API call
        # Example: Calling a Vertex AI endpoint
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = requests.post(self._endpoint_url, headers=headers, json=payload,
                                 timeout=60)

        logger.info(f"LLM call status code: {response.status_code}, status reason: {response.reason}")
        response_dict = response.json()
        final_response = response_dict["choices"][0]["message"]["content"]
        return get_json_from_model_response(final_response)

    def _get_credentials_from_secret(self):
        """Loads Google Cloud credentials from an environment variable."""

        if not self._api_key:
            raise ValueError(
                f"Environment variable 'GCLOUD_SA_KEY' not found. Please set it in your Hugging Face Space secrets.")
        logger.info("Loading Google Cloud credentials...")
        # Parse the JSON string into a dictionary
        credentials_info = json.loads(self._api_key)

        logger.info("Google Cloud credentials loaded.")
        # Define the required scopes for the API you want to access
        scopes = ['https://www.googleapis.com/auth/cloud-platform']

        # Create credentials from the dictionary
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=scopes
        )

        return credentials

    def _get_access_token(self, credentials):
        """Refreshes the credentials to get a valid access token."""
        from google.auth.transport.requests import Request

        # Refresh the token to ensure it's not expired
        credentials.refresh(Request())
        return credentials.token