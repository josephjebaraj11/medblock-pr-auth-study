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
import styles from './LandingScreen.module.css';
import IconAstrophotography from '../icons/IconAstrophotography';
import IconPerson from '../icons/IconPerson';
import IconGemma from '../icons/IconGemma';
import demoImage from '../assets/home_chest_logo.jpg';

const LandingScreen = ({onStartJourney}) => {
	return (
		<div className={styles.pageWrapper}>
			<div className={styles.mainContainer}>
				<div className={styles.bgRectangle}></div>
				<img src={demoImage} alt="Radiology scan" className={styles.droppedImage}/>
				<div className={styles.chatCard}>
					<div className={styles.chatBubbleContainer}>
						<div className={styles.iconCircle} style={{background: '#C2E7FF'}}>
							<IconAstrophotography/>
						</div>
						<div className={styles.textBubble} style={{background: '#C2E7FF'}}>
							<div className={styles.textLine} style={{width: '266px'}}></div>
							<div className={styles.textLine} style={{width: '266px'}}></div>
							<div className={styles.textLine} style={{width: '108px'}}></div>
						</div>
					</div>
					<div className={`${styles.chatBubbleContainer} ${styles.userBubble}`}>
						<div className={styles.textBubbleUser}>
							<div className={styles.textLine} style={{width: '266px'}}></div>
							<div className={styles.textLine} style={{width: '266px'}}></div>
							<div className={styles.textLine} style={{width: '108px'}}></div>
						</div>
						<div className={styles.iconCircle} style={{background: '#0B57D0'}}>
							<IconPerson/>
						</div>
					</div>
				</div>

				<div className={styles.rightContent}>
					<h1 className={styles.title}>Radiology Learning Companion Demo</h1>
					<p className={styles.subtext}>
						Mastering Chest X-Ray (CXR) is a complex skill. What if AI could facilitate your learning process? This demo
						shows that MedGemma can be used to build such a tool to help medical students sharpen their CXR
						interpretation skills. Select a case, and the system will guide you through various observations to a
						clinical finding using multiple-choice questions, concluding with a summary of your learning journey.
						<br/><br/>
						MedGemma capabilities showcased
						<ul>
							<li>Multimodal input: CXR images and corresponding clinical findings.</li>
							<li>Integrating clinical guidelines: Leverages context through RAG.</li>
							<li>Medical reasoning: Personalized learning journey based on inputs.</li>
						</ul>
					</p>
					<div className={styles.disclaimerAndButtonContainer}>
						<p className={styles.disclaimerText}>
							<span className={styles.highlightAnchor}>Disclaimer:</span> This demonstration is for illustrative
							purposes only and does not represent a finished or approved product. It is not representative of
							compliance to any regulations or standards for quality, safety or efficacy. Any real-world application
							would require additional development, training, and adaptation. The experience highlighted in this demo
							shows MedGemma's baseline capability for the displayed task and is intended to help developers and users
							explore possible applications and inspire further development.
						</p>
						<button className={styles.viewDemoButton} onClick={onStartJourney}>
							View Demo
						</button>
					</div>
				</div>

				<div className={styles.logoContainer}>
					<span className={styles.logoText}>Med</span>
					<IconGemma className={styles.logoSvg}/>
				</div>
			</div>
		</div>
	);
};

export default LandingScreen;