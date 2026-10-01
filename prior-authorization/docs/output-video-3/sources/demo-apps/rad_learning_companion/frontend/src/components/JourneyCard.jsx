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
import styles from './JourneyCard.module.css';
import IconArticlePerson from '../icons/IconArticlePerson';

const JourneyCard = ({journey, onLaunch}) => {
	return (
		<div className={styles.card}>
			<img src={journey.imageUrl} alt={journey.label} className={styles.cardImage}/>
			<div className={styles.cardFooter}>
				<span className={styles.label}>{journey.label}</span>
				<button className={styles.launchButton} onClick={onLaunch}>
					<IconArticlePerson className={styles.buttonIcon}/>
					Launch
				</button>
			</div>
		</div>
	);
};

export default JourneyCard;