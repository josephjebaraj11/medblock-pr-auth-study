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


import React, {useEffect, useRef, useState} from 'react';
import IconBackArrow from '../icons/IconBackArrow';
import IconCodeBlocks from '../icons/IconCodeBlocks';
import IconWarning from '../icons/IconWarning';
import MCQOption from '../components/MCQOption';
import ChatMessage from '../components/ChatMessage';
import styles from './ChatScreen.module.css';
import TextWithTooltips from '../components/TextWithTooltips';
import {redactPhrases} from "../components/RedactedTextView.js";
import {CONDITION_TERMS} from "../data/constants.js";
import { fetchWithRetry } from '../utils/fetchWithRetry'; 

const API_ENDPOINTS = {
	getCaseImage: (journeyId) => `/api/case/${journeyId}/stub`,
	getCaseQuestions: (journeyId) => `/api/case/${journeyId}/all-questions`,
	summarizeCase: (journeyId) => `/api/case/${journeyId}/summarize`,
};

const ChatScreen = ({journey, onNavigate, onShowDetails, cachedImage, onImageLoad, onGoToSummary}) => {
	const [allQuestions, setAllQuestions] = useState([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [messages, setMessages] = useState([]);
	const [caseImage, setCaseImage] = useState(cachedImage || '');
	const [modelResponseHistory, setModelResponseHistory] = useState([]);
	const [isSummarizing, setIsSummarizing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isImageLoading, setIsImageLoading] = useState(true);
	const [imageError, setImageError] = useState(false);

	const [userActionHistory, setUserActionHistory] = useState({});

	const chatWindowRef = useRef(null);
	const timeoutIdsRef = useRef([]);

	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTo({
				top: chatWindowRef.current.scrollHeight,
				behavior: 'smooth'
			});
		}
	}, [messages, isLoading]);

	useEffect(() => {
		const fetchImage = async () => {
			if (cachedImage) {
				setCaseImage(cachedImage);
				setIsImageLoading(false);
				return;
			}

			if (journey) {
				setIsImageLoading(true);
				setImageError(false);
				try {
					const response = await fetchWithRetry(API_ENDPOINTS.getCaseImage(journey.id));
					if (!response.ok) throw new Error("Failed to fetch case image");
					const data = await response.json();
					const imageUrl = data.download_image_url;
					setCaseImage(imageUrl);
					if (onImageLoad) onImageLoad(imageUrl);
				} catch (error) {
					console.error("Error fetching case data:", error);
					setImageError(true);
				} finally {
					setIsImageLoading(false);
				}
			}
		};
		fetchImage();
	}, [journey, cachedImage, onImageLoad]);

	useEffect(() => {
		if (!journey) {
			setIsLoading(false);
			return;
		}
		const fetchQuestions = async () => {
			setIsLoading(true);
			setMessages([]);
			try {
				const response = await fetchWithRetry(API_ENDPOINTS.getCaseQuestions(journey.id));
				if (!response.ok) throw new Error("Failed to fetch questions");
				const questions = await response.json();
				if (questions && questions.length > 0) {
					const questionsWithIds = questions.map((q, index) => ({...q, id: `q-${journey.id}-${index}`}));
					setAllQuestions(questionsWithIds);
					setCurrentQuestionIndex(0);
					displayQuestion(questionsWithIds[0], 0, questionsWithIds.length);
				} else {
					setMessages([{
						type: 'system',
						id: Date.now(),
						content: "Sorry, I couldn't load the questions for this case. Try again later!"
					}]);
				}
			} catch (error) {
				console.error("Error fetching questions:", error);
				setMessages([{
					type: 'system',
					id: Date.now(),
					content: "Sorry, I couldn't load the questions for this case. Try again later!"
				}]);
			} finally {
				setIsLoading(false);
			}
		};
		fetchQuestions();
	}, [journey]);

	useEffect(() => {
		return () => {
			timeoutIdsRef.current.forEach(clearTimeout);
		};
	}, []);


	const displayQuestion = (questionData, index, totalQuestions) => {
		let questionText = `Question ${index + 1}: ${questionData.question}`;
		if (index === 0) {
			questionText = `Okay, let's start with Case ${journey.id.padStart(2, '0')}. ${questionData.question}`;
		}

		const questionMessage = {type: 'system', id: Date.now(), content: questionText};
		const mcqMessage = {
			type: 'mcq',
			id: questionData.id || `q-${index}`,
			data: questionData,
			isLast: index === totalQuestions - 1,
			incorrectAttempts: [],
			isAnswered: false,
		};
		setMessages(prev => [...prev, questionMessage, mcqMessage]);
	};

	const handleSelectOption = (selectedOptionKey, messageId) => {
		const currentMCQMessageIndex = messages.findIndex(m => m.id === messageId && !m.isAnswered);
		if (currentMCQMessageIndex === -1) return;

		const currentMCQMessage = messages[currentMCQMessageIndex];
		const {answer, rationale, hint, choices, id: questionId} = currentMCQMessage.data;
		const selectedOptionText = choices[selectedOptionKey];
		const isCorrect = selectedOptionKey === answer;

		setUserActionHistory(prev => {
			const newHistory = {...prev};
			if (!newHistory[questionId]) {
				newHistory[questionId] = {attempt1: selectedOptionKey};
			} else if (!newHistory[questionId].attempt2) {
				newHistory[questionId] = {...newHistory[questionId], attempt2: selectedOptionKey};
			}
			return newHistory;
		});

		let userResponseMessage = {type: 'user', id: Date.now(), content: `You responded: "${selectedOptionText}"`};

		const updatedMessages = messages.map(msg =>
			msg.id === messageId ? {...msg, isAnswered: true} : msg
		);
		setMessages([...updatedMessages, userResponseMessage]);

		let feedbackMessages = [];

		const handleNextStep = (isQuestionComplete) => {
			if (isQuestionComplete) {
				setModelResponseHistory(prev => [...prev, currentMCQMessage.data]);
			}

			if (currentMCQMessage.isLast && isQuestionComplete) {
				feedbackMessages.push({type: 'summary_button', id: Date.now() + 2});
			} else if (isQuestionComplete) {
				const nextIndex = currentQuestionIndex + 1;
				if (nextIndex < allQuestions.length) {
					const timerId = setTimeout(() => {
						setCurrentQuestionIndex(nextIndex);
						displayQuestion(allQuestions[nextIndex], nextIndex, allQuestions.length);
					}, 1500);
					timeoutIdsRef.current.push(timerId);
				}
			}
		};

		let redactedRationale = "";
		if (!currentMCQMessage.isLast) {
			redactedRationale = redactPhrases(rationale, CONDITION_TERMS);
		} else {
			redactedRationale = rationale
		}

		if (isCorrect) {
			feedbackMessages.push({type: 'system', id: Date.now() + 1, content: `That's right. ${redactedRationale}`});
			handleNextStep(true);
		} else {
			const attempts = [...currentMCQMessage.incorrectAttempts, selectedOptionKey];
			if (attempts.length < 2) {
				feedbackMessages.push({
					type: 'system_hint', id: Date.now() + 1,
					content: `That's not quite right. Would you like to try again?`,
					hint: `Hint: ${hint}`,
				});
				feedbackMessages.push({
					...currentMCQMessage, type: 'mcq_retry', id: Date.now() + 2,
					incorrectAttempts: attempts, isAnswered: false,
				});
			} else {
				feedbackMessages.push({
					type: 'system', id: Date.now() + 1,
					content: `That's not right. The correct answer is "${choices[answer]}". ${redactedRationale}`
				});
				handleNextStep(true);
			}
		}

		const timerId = setTimeout(() => {
			setMessages(prev => [...prev, ...feedbackMessages]);
		}, 800);
		timeoutIdsRef.current.push(timerId);
	};

	const handleGoToSummary = async () => {
		setIsSummarizing(true);
		const conversation_history = modelResponseHistory.map(modelResponse => {
			const userResponse = userActionHistory[modelResponse.id] || {};

			const finalUserResponse = {
				attempt1: userResponse.attempt1 || null,
				attempt2: userResponse.attempt2 || null,
			};

			return {
				ModelResponse: modelResponse,
				UserResponse: finalUserResponse
			};
		});

		try {
			const response = await fetchWithRetry(API_ENDPOINTS.summarizeCase(journey.id), {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({conversation_history})
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch summary. Status: ${response.status}`);
			}

			const summaryData = await response.json();
			onGoToSummary(summaryData);
		} catch (error) {
			console.error("Error fetching summary:", error);
			setMessages(prev => [...prev, {
				type: 'system',
				id: Date.now(),
				content: "Sorry, there was an error generating the summary.Please try again."
			}]);
		} finally {
			setIsSummarizing(false);
		}
	};

	return (
		<div className={styles.pageContainer}>
			<div className={styles.topNav}>
				<button className={styles.navButton} onClick={() => onNavigate('landing')}>
					<IconBackArrow/> <span>Exit</span>
				</button>
				<button className={styles.detailsButton} onClick={onShowDetails}>
					<IconCodeBlocks fill="#004A77"/> Details about this Demo
				</button>
			</div>
			<div className={styles.contentBox}>
				<div className={styles.mainLayout}>
					<div className={styles.leftPanel}>
						{isImageLoading ? (
							<div className={styles.loadingContainer}>
								<div className={styles.loadingSpinner}></div>
								<p className={styles.loadingText}>Loading Chest X-Ray image...</p>
							</div>
						) : imageError ? (
							<div className={styles.imageErrorFallback}>
								<p>⚠️</p>
								<p>Could not load case image. Please try again.</p>
							</div>
						) : (
							<img
								src={caseImage}
								alt={`Image for Case ${journey.label}`}
								className={styles.caseImage}
							/>
						)}
					</div>
					<div className={styles.rightPanel}>
						{!isLoading && allQuestions.length > 0 && (
							<div className={styles.progressTracker}>
								{modelResponseHistory.length} / {allQuestions.length} questions answered
							</div>
						)}
						<div className={styles.chatWindow} ref={chatWindowRef}>
							{isLoading ? (
								<div className={styles.loadingContainer}>
									<div className={styles.loadingSpinner}></div>
									<p className={styles.loadingText}>Loading questions...</p>
								</div>
							) : (
								messages.map((msg) => {
									switch (msg.type) {
										case 'mcq':
										case 'mcq_retry':
											return (
												<div key={msg.id} className={styles.mcqOptionsOnly}>
													{Object.entries(msg.data.choices).map(([key, value]) => (
														<MCQOption
															key={key}
															text={value}
															onClick={() => handleSelectOption(key, msg.id)}
															disabled={msg.isAnswered || msg.incorrectAttempts.includes(key)}
															isIncorrect={msg.incorrectAttempts.includes(key)}
														/>
													))}
												</div>
											);
										case 'user':
											return (
												<ChatMessage key={msg.id} type="user" text={msg.content}/>
											);
										case 'system':
										case 'system_hint':
											return (
												<ChatMessage key={msg.id} type="system">
													<p>
														<TextWithTooltips text={msg.content}/>
													</p>
													{msg.hint && (
														<p className={styles.hintText}>
															<TextWithTooltips text={msg.hint}/>
														</p>
													)}
												</ChatMessage>
											);
										case 'summary_button':
											return (
												<div key={msg.id} className={styles.summaryButtonContainer}>
													<button onClick={handleGoToSummary} className={styles.summaryButton} disabled={isSummarizing}>
														{isSummarizing ? 'Generating Summary...' : 'Go to case review and summary'}
													</button>
												</div>
											);
										default:
											return null;
									}
								})
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
				</div>
			</div>
		</div>
	);
};

export default ChatScreen;