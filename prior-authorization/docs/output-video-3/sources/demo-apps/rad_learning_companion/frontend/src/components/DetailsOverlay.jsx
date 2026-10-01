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
import styles from './DetailsOverlay.module.css';
import IconClose from '../icons/IconClose';

const DetailsOverlay = ({onClose}) => {
	return (
		<div className={styles.dialogOverlay} onClick={onClose} role="dialog" aria-modal="true"
		     aria-labelledby="dialog-title">
			<div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
				<button id="dialog-close-button" className={styles.dialogCloseBtn} aria-label="Close dialog" onClick={onClose}>
					<IconClose/>
				</button>
				<h2 id="dialog-title" className={styles.dialogTitleText}>Details About This Demo</h2>
				<div className={styles.dialogBodyScrollable}>
					<p>
						<b>The Model:</b> This demo features Google's MedGemma-27B, a Gemma 3-based model fine-tuned for
						comprehending medical text and images, specifically Chest X-Rays. It demonstrates MedGemma's ability to
						facilitate the learning process for medical students by advanced interpretation of medical images and
						contextual question generation while leveraging clinical guidelines. Context from clinical guidelines are
						generated using RAG which utilizes Google's MedSigLIP embedding model to build a vector index database.
					</p>
					<p>
						<b>Accessing and Using the Model:</b> Google's MedGemma-27B is available on{' '}
						<a href="https://huggingface.co/google/medgemma-27b-it" target="_blank" rel="noopener noreferrer">
							HuggingFace<img className={styles.inlineLogo}
							                src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg"
							                alt="Hugging Face Logo"/>
						</a>{' '}
						and{' '}
						<a href="https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/medgemma" target="_blank"
						   rel="noopener noreferrer">
							Model Garden <img className={styles.inlineLogo}
							                  src="https://www.gstatic.com/cloud/images/icons/apple-icon.png"
							                  alt="Model Garden Logo"/>
						</a>.
						Learn more about using the model and its limitations on the{' '}
						<a href="https://developers.google.com/health-ai-developer-foundations?referral=rad_learning_companion"
						   target="_blank" rel="noopener noreferrer">
							HAI-DEF developer site
						</a>.
					</p>
					<p>
						<b>Health AI Developer Foundations (HAI-DEF):</b> Provides a collection of open-weight models and companion
						resources to empower developers in building AI models for healthcare.
					</p>
					<p>
						<b>Enjoying the Demo?</b> We'd love your feedback! If you found this demo helpful, please show your
						appreciation by clicking the ❤️ button on the HuggingFace page, linked at the top.
					</p>
					<p>
						<b>Explore More Demos:</b> Discover additional demos on HuggingFace Spaces or via Colabs:
					</p>
					<ul>
						<li>
							<a href="https://huggingface.co/spaces/google/cxr-foundation-demo" target="_blank"
							   rel="noopener noreferrer">
								CXR Foundations Demo <img className={styles.inlineLogo}
								                          src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg"
								                          alt="Hugging Face Logo"/>
							</a>{' '}
							- Showcases on-browser, data-efficient, and zero-shot classification of CXR images.
						</li>
						<li>
							<a href="https://huggingface.co/spaces/google/path-foundation-demo" target="_blank"
							   rel="noopener noreferrer">
								Path Foundations Demo <img className={styles.inlineLogo}
								                           src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg"
								                           alt="Hugging Face Logo"/>
							</a>{' '}
							- Highlights on-browser, data-efficient classification and outlier detection within pathology slides.
						</li>
						<li>
							<a href="https://huggingface.co/spaces/google/rad_explain" target="_blank" rel="noopener noreferrer">
								MedGemma Rad Explain <img className={styles.inlineLogo}
								                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Echo_link-blue_icon_slanted.svg/1920px-Echo_link-blue_icon_slanted.svg.png"
								                          alt="Link icon"/>
							</a>{' '}
							- Analyzes a radiology report and its corresponding CXR/CT image, generating AI explanations for selected
							sentences with visual context.
						</li>
						<li>
							<a href="https://github.com/Google-Health/medgemma/tree/main/notebooks/fine_tune_with_hugging_face.ipynb"
							   target="_blank" rel="noopener noreferrer">
								Finetune MedGemma Colab <img className={styles.inlineLogo}
								                             src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Colaboratory_SVG_Logo.svg"
								                             alt="Google Colab Logo"/>
							</a>{' '}
							- See an example of how to fine-tune this model.
						</li>
						<li>
							<a href="https://huggingface.co/spaces/google/appoint-ready" target="_blank" rel="noopener noreferrer">
								Simulated Pre-visit Intake <img className={styles.inlineLogo}
								                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Echo_link-blue_icon_slanted.svg/1920px-Echo_link-blue_icon_slanted.svg.png"
								                                alt="Link icon"/>
							</a>{' '}
							- Simulates a pre-visit patient dialogue, generating an intelligent intake report with self-evaluated
							insights for efficient provider use.
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default DetailsOverlay;