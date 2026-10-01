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

import React from 'react';
import {medicalTerms} from '../data/medicalTerms';

const TextWithTooltips = ({text}) => {
	const sortedKeys = Object.keys(medicalTerms).sort((a, b) => b.length - a.length);
	const regex = new RegExp(`(${sortedKeys.join('|')})`, 'gi');
	const parts = text.split(regex);

	return (
		<>
			{parts.map((part, index) => {
				const lowerCasePart = part.toLowerCase();
				if (medicalTerms[lowerCasePart]) {
					return (
						<span
							key={index}
							className="tooltip-trigger"
							data-tooltip-content={medicalTerms[lowerCasePart]}
							style={{borderBottom: '1px dotted'}}
						>
              {part}
            </span>
					);
				}
				return part;
			})}
		</>
	);
};

export default TextWithTooltips;