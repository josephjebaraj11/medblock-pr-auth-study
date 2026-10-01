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


import React, {useEffect, useState} from 'react';
import JourneyCard from '../components/JourneyCard';
import IconCodeBlocks from '../icons/IconCodeBlocks';
import IconBackArrow from '../icons/IconBackArrow';
import IconInfo from '../icons/IconInfo';
import styles from './JourneySelectionScreen.module.css';
import {CXR_14_CITATION} from "../data/constants.js";
import { fetchWithRetry } from '../utils/fetchWithRetry'; 

const JourneySelectionScreen = ({onLaunchJourney, onNavigate, onShowDetails}) => {
	const [journeys, setJourneys] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchCases = async () => {
			try {
				const response = await fetchWithRetry('/api/case/stub');
				if (!response.ok) {
					throw new Error(`Network response was not ok, couldn't load images: ${response.statusText}`);
				}
				const data = await response.json();
				const formattedData = data.map(caseItem => ({
					id: caseItem.id,
					label: `Case ${caseItem.id.padStart(2, '0')}`,
					imageUrl: caseItem.download_image_url
				}));
				setJourneys(formattedData);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};
		fetchCases();
	}, []);

	return (
		<div className={styles.pageContainer}>
			<div className={styles.topNav}>
				<button className={styles.backButton} onClick={() => onNavigate('landing')}>
					<IconBackArrow/>
					<span>Back</span>
				</button>
				<button className={styles.detailsButton} onClick={onShowDetails}>
					<IconCodeBlocks className={styles.detailsIcon}/>
					Details about this Demo
				</button>
			</div>

			<div className={styles.contentBox}>
				<div className={styles.contentHeader}>
					<h1 className={styles.title}>Select a Case</h1>
					<p className={styles.subtext}>
						This demo uses 2 Chest X-Rays as an example set (
						<span className={styles.imageSource}>
              <span
	              className="tooltip-trigger"
	              data-tooltip-content={CXR_14_CITATION}
	              style={{borderBottom: '1px dotted'}}
              >
                Image source: CXR-14 Dataset
              </span>
            </span>
						)
					</p>
				</div>

				<div className={styles.journeysContainer}>
					{isLoading ? (
						<div className={styles.statusContainer}>
							<div className={styles.loadingSpinner}></div>
							<p className={styles.statusText}>Loading available cases...</p>
						</div>
					) : error ? (
						<div className={`${styles.statusContainer} ${styles.errorContainer}`}>
							<p className={styles.statusText}>⚠️</p>
							<p className={styles.statusText}>Could not load cases. Please try again later.</p>
						</div>
					) : (
						journeys.map(journey => (
							<JourneyCard
								key={journey.id}
								journey={journey}
								onLaunch={() => onLaunchJourney(journey)}
							/>
						))
					)}
				</div>

				<br/>
				<p className={styles.subtext}>
					MedGemma utilises RAG to dynamically include additional context from&nbsp;
					<a href="https://www.who.int/publications/i/item/9241546778" target="_blank" rel="noopener noreferrer">
						The WHO manual of diagnostic imaging
					</a>
					<span
						className="tooltip-trigger"
						data-tooltip-content="This demo uses MedGemma to generate a learning module for analyzing chest X-rays, leveraging a RAG system to ground every question's rationale and hint in the authoritative WHO guideline."
					>
            <IconInfo/>
          </span>

				</p>
				<p className={styles.subtext}>
					This demo is built with the assumption that the user has basic medical knowledge. The experience is designed
					to guide the user through a case, facilitating learning along the process.
				</p>
			</div>
		</div>
	);
};

export default JourneySelectionScreen;