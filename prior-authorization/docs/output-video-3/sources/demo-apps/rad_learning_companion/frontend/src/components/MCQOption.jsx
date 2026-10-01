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
import IconRadioButton from '../icons/IconRadioButton';
import styles from './MCQOption.module.css';
import TextWithTooltips from './TextWithTooltips';

const MCQOption = ({text, onClick, disabled, isSelected, isIncorrect}) => {
	const buttonClasses = [
		styles.optionButton,
		isSelected ? styles.selected : '',
		isIncorrect ? styles.incorrect : ''
	].join(' ');

	return (
		<button
			className={buttonClasses}
			onClick={onClick}
			disabled={disabled}
		>
			<IconRadioButton/>
			<span><TextWithTooltips text={text}/></span>
		</button>
	);
};

export default MCQOption;