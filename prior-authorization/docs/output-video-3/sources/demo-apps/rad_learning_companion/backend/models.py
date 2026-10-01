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

from dataclasses import dataclass
from typing import Any


@dataclass
class ClinicalMCQ:
    id: str
    question: str
    choices: dict[str, str]
    hint: str
    answer: str
    rationale: str


@dataclass
class Case:
    id: str
    condition_name: str
    ground_truth_labels: dict[str, str]
    download_image_url: str
    potential_findings: str


#### For Summary ####
@dataclass
class UserResponse:
    """Represents the user's attempts for a single question."""
    attempt1: str
    attempt2: str | None


@dataclass
class ConversationTurn:
    clinicalMcq: ClinicalMCQ
    userResponse: UserResponse

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConversationTurn":
        """
        A factory method to create a ConversationTurn instance from a dictionary.
        This handles the nested instantiation of the other dataclasses.
        """
        # This will raise a TypeError or KeyError if the structure is wrong,
        # which provides robust validation.
        question_data = data['ModelResponse']
        user_response_data = data['UserResponse']

        return cls(
            clinicalMcq=ClinicalMCQ(**question_data),
            userResponse=UserResponse(**user_response_data)
        )


@dataclass
class QuestionOutcome:
    """Represents a single outcome line for a question."""
    type: str  # "Correct" or "Incorrect"
    text: str  # The actual answer text


@dataclass
class AnswerLog:
    """A log detailing the user's performance on a single question for the rationale,
    now including explicit correct and user's chosen (if incorrect) answers."""
    question: str
    outcomes: list[QuestionOutcome]  # A list to hold multiple outcome lines

    @classmethod
    def from_dict(cls, data: dict) -> "AnswerLog":
        # Convert the list of outcome dicts into a list of QuestionOutcome objects
        outcomes = [QuestionOutcome(**o) for o in data['outcomes']]
        return cls(question=data['question'], outcomes=outcomes)


@dataclass
class CaseSummary:
    """Represents the final, structured summary with the new fields."""
    med_gemma_interpretation: str
    rationale: list[AnswerLog]
    potential_findings: str
    guideline_specific_resource: str
    condition: str

    @classmethod
    def from_dict(cls, data: dict) -> "CaseSummary":
        # Use the AnswerLog.from_dict method to reconstruct the rationale list
        rationale_logs = [AnswerLog.from_dict(r) for r in data['rationale']]
        return cls(
            med_gemma_interpretation=data['med_gemma_interpretation'],
            rationale=rationale_logs,
            potential_findings=data['potential_findings'],
            guideline_specific_resource=data['guideline_specific_resource'],
            condition=data['condition']
        )
