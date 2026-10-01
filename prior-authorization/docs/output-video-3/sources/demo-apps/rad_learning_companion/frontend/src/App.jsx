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


import React, {useState} from 'react';
import LandingScreen from './screens/LandingScreen';
import JourneySelectionScreen from './screens/JourneySelectionScreen';
import ChatScreen from './screens/ChatScreen';
import SummaryScreen from './screens/SummaryScreen';
import DetailsOverlay from './components/DetailsOverlay';
import {Tooltip} from 'react-tooltip'; // ADD THIS
import 'react-tooltip/dist/react-tooltip.css'; // ADD THIS

function App() {
	const [currentScreen, setCurrentScreen] = useState('landing');
	const [selectedJourney, setSelectedJourney] = useState(null);
	const [isDetailsOverlayVisible, setIsDetailsOverlayVisible] = useState(false);
	const [caseImagesCache, setCaseImagesCache] = useState({});
	const [summaryData, setSummaryData] = useState(null);

	const handleLaunchJourney = (journey) => {
		setSelectedJourney(journey);
		setSummaryData(null);
		setCurrentScreen('chat');
	};

	const handleNavigate = (screen) => {
		setCurrentScreen(screen);
	};

	const handleShowDetails = (show) => {
		setIsDetailsOverlayVisible(show);
	};

	const updateImageCache = (caseId, imageUrl) => {
		setCaseImagesCache(prevCache => ({
			...prevCache,
			[caseId]: imageUrl
		}));
	};

	const handleGoToSummary = (data) => {
		setSummaryData(data);
		setCurrentScreen('summary');
	};

	const renderScreen = () => {
		const screenProps = {
			onNavigate: handleNavigate,
			onShowDetails: () => handleShowDetails(true)
		};

		switch (currentScreen) {
			case 'journeySelection':
				return <JourneySelectionScreen {...screenProps} onLaunchJourney={handleLaunchJourney}/>;
			case 'chat':
				return (
					<ChatScreen
						{...screenProps}
						journey={selectedJourney}
						cachedImage={caseImagesCache[selectedJourney?.id]}
						onImageLoad={(imageUrl) => updateImageCache(selectedJourney.id, imageUrl)}
						onGoToSummary={handleGoToSummary}
					/>
				);
			case 'summary':
				return (
					<SummaryScreen
						{...screenProps}
						journey={selectedJourney}
						cachedImage={caseImagesCache[selectedJourney?.id]}
						summaryData={summaryData}
					/>
				);
			case 'landing':
			default:
				return <LandingScreen
					onStartJourney={() => handleNavigate('journeySelection')}
					onShowDetails={screenProps.onShowDetails}
				/>;
		}
	};

	return (
		<div className="app-container">
			{renderScreen()}
			{isDetailsOverlayVisible && <DetailsOverlay onClose={() => handleShowDetails(false)}/>}

			<Tooltip anchorSelect=".tooltip-trigger" className="custom-tooltip" arrow={true}/>
		</div>
	);
}

export default App;