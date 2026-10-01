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
import styles from './SummaryScreen.module.css';
import IconBackArrow from '../icons/IconBackArrow';
import IconCodeBlocks from '../icons/IconCodeBlocks';
import IconWarning from '../icons/IconWarning';
import TextWithTooltips from '../components/TextWithTooltips';


const SummaryScreen = ({journey, onNavigate, onShowDetails, cachedImage, summaryData}) => {

	// Display a loading state if summary data hasn't been passed yet
	if (!summaryData) {
		return (
			<div className={styles.pageContainer}>
				<div className={styles.contentBox}>
					<div className={styles.loadingContainer}>
						<h2>Generating Your Case Summary...</h2>
						<p>This may take a moment.</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.pageContainer}>
			<div className={styles.topNav}>
				<button className={styles.backButton} onClick={() => onNavigate('landing')}>
					<IconBackArrow/> Exit
				</button>
				<button className={styles.detailsButton} onClick={onShowDetails}>
					<IconCodeBlocks className={styles.detailsIcon}/>
					Details about this Demo
				</button>
			</div>
			<div className={styles.contentBox}>
				<main className={styles.mainLayout}>
					<div className={styles.leftPanel}>
						{cachedImage ? (
							<img src={cachedImage} alt={journey?.label} className={styles.caseImage}/>
						) : <p>Loading image...</p>}
					</div>
					<div className={styles.rightPanel}>
						<div className={styles.summaryContentWrapper}>
							<h1 className={styles.mainTitle}>Case {journey?.id} Review and Summary</h1>

							<div className={styles.summarySection}>
								<p className={styles.sectionText}>Thanks for taking this learning journey! </p>
							</div>
							<div className={styles.summarySection}>
								<h2 className={styles.sectionTitle}>Potential Findings</h2>
								<p className={styles.sectionText}>{summaryData.potential_findings}</p>
							</div>

							<div className={styles.summarySection}>
								<p className={styles.sectionText}>Here is a breakdown from your session:</p>
							</div>

							<div className={styles.summarySection}>
								<h2 className={styles.sectionTitle}>Response Review</h2>
								<div className={styles.rationaleContainer}>
									{summaryData.rationale.map((log, index) => {
										// Determine the overall status for this question's block
										let overallQuestionStatusClass = '';
										const hasIncorrectOutcome = log.outcomes.some(
											(outcomeItem) => outcomeItem.type === 'Incorrect'
										);

										if (hasIncorrectOutcome) {
											overallQuestionStatusClass = styles.incorrect; // Overall question is incorrect
										} else {
											overallQuestionStatusClass = styles.correct; // Overall question is correct
										}

										return (
											// Apply the overall status class to the main item container
											<div
												key={index}
												className={`${styles.rationaleItem} ${overallQuestionStatusClass}`}
											>
												<p className={styles.rationaleQuestion}>
													<b>Q{index + 1}:</b> <TextWithTooltips text={log.question}/>
												</p>
												<p className={styles.rationaleOutcome}>
													<ul>
														{/* Iterate over the 'outcomes' array for each AnswerLog */}
														{log.outcomes.map((outcomeItem, lineIndex) => {
															// Applying the overall question status class directly to each list item
															return (
																<li key={lineIndex} className={overallQuestionStatusClass}>
																	<b>{outcomeItem.type}</b> -{' '}
																	<TextWithTooltips text={outcomeItem.text}/>
																</li>
															);
														})}
													</ul>
												</p>
											</div>
										);
									})}
								</div>
							</div>

							{summaryData.guideline_specific_resource && (
								<div className={styles.summarySection}>
									<p className={styles.sectionText}>
										{`You can always reference the condition: "${summaryData.condition}" from pages ${summaryData.guideline_specific_resource} from `}
										<a href="https://www.who.int/publications/i/item/9241546778" target="_blank"
										   rel="noopener noreferrer" className={styles.guidelineLink}>
											The WHO manual of diagnostic imaging
										</a>
									</p>
								</div>
							)}
						</div>
						<div className={styles.disclaimerBox}>
							<IconWarning className={styles.disclaimerIcon}/>
							<p className={styles.disclaimerText}>This demonstration is for illustrative purposes of MedGemma’s
								baseline capabilities only. It does not represent a finished or approved product, is not intended to
								diagnose or suggest treatment of any disease or condition, and should not be used for medical
								advice.</p>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default SummaryScreen;