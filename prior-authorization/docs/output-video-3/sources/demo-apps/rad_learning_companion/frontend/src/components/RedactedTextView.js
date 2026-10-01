/*
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
*/

/**
 * Replaces specified phrases (multi-word strings) in a text string with '__?___'.
 * @param {string} inputText The text to process.
 * @param {string[]} phrasesToRedact An array of phrases to be replaced.
 * @returns {string} The text with specified phrases redacted.
 */
export const redactPhrases = (inputText, phrasesToRedact) => {
	if (!inputText || !phrasesToRedact || phrasesToRedact.length === 0) {
		return inputText || "";
	}

	let processedText = inputText;

	// Sort phrases by length (descending) to redact longer phrases first.
	// This prevents issues where a shorter phrase is part of a longer one.
	const sortedPhrases = phrasesToRedact.sort((a, b) => b.length - a.length);

	sortedPhrases.forEach(phrase => {
		// Create a global, case-insensitive regex for the current phrase.
		const regex = new RegExp(phrase, 'gi');
		// Replace the found phrase with 'X's of the same length.
		processedText = processedText.replace(regex, '__?__');
	});

	return processedText;
};