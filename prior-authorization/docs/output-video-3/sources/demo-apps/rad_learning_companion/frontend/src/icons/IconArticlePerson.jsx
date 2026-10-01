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

const IconArticlePerson = ({className, ...props}) => {
	return (
		<svg
			width="20"
			height="20"
			viewBox="14 16 17 17"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
			preserveAspectRatio="xMidYMid meet"
		>
			<path
				d="M18 21.5H26V20H18V21.5ZM16.5 31C16.0833 31 15.7292 30.8542 15.4375 30.5625C15.1458 30.2708 15 29.9167 15 29.5V18.5C15 18.0833 15.1458 17.7292 15.4375 17.4375C15.7292 17.1458 16.0833 17 16.5 17H27.5C27.9167 17 28.2708 17.1458 28.5625 17.4375C28.8542 17.7292 29 18.0833 29 18.5V22.5417C28.6667 22.2083 28.2847 21.9514 27.8542 21.7708C27.4236 21.5903 26.9722 21.5 26.5 21.5C25.875 21.5 25.2917 21.6597 24.75 21.9792C24.2083 22.2847 23.7778 22.7083 23.4583 23.25H18V24.75H23C22.9722 25.0556 22.9861 25.3542 23.0417 25.6458C23.1111 25.9375 23.2083 26.2222 23.3333 26.5H18V28H22.3333C22.0694 28.25 21.8611 28.5417 21.7083 28.875C21.5694 29.1944 21.5 29.5347 21.5 29.8958V31H16.5ZM23 31V29.8958C23 29.7431 23.0278 29.6042 23.0833 29.4792C23.1389 29.3403 23.2222 29.2222 23.3333 29.125C23.7778 28.75 24.2708 28.4722 24.8125 28.2917C25.3542 28.0972 25.9167 28 26.5 28C27.0833 28 27.6458 28.0972 28.1875 28.2917C28.7292 28.4722 29.2222 28.75 29.6667 29.125C29.7778 29.2222 29.8611 29.3403 29.9167 29.4792C29.9722 29.6042 30 29.7431 30 29.8958V31H23ZM26.5 27C25.9444 27 25.4722 26.8056 25.0833 26.4167C24.6944 26.0278 24.5 25.5556 24.5 25C24.5 24.4444 24.6944 23.9722 25.0833 23.5833C25.4722 23.1944 25.9444 23 26.5 23C27.0556 23 27.5278 23.1944 27.9167 23.5833C28.3056 23.9722 28.5 24.4444 28.5 25C28.5 25.5556 28.3056 26.0278 27.9167 26.4167C27.5278 26.8056 27.0556 27 26.5 27Z"
			/>
		</svg>
	);
};

export default IconArticlePerson;