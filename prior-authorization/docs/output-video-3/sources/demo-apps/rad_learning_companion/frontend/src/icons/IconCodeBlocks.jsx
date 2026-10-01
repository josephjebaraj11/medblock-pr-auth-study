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

const IconCodeBlocks = ({className, ...props}) => {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M8 12.5L9.0625 11.4375L7.625 10L9.0625 8.5625L8 7.5L5.5 10L8 12.5ZM12 12.5L14.5 10L12 7.5L10.9375 8.5625L12.375 10L10.9375 11.4375L12 12.5ZM4.5 17C4.08333 17 3.72917 16.8542 3.4375 16.5625C3.14583 16.2708 3 15.9167 3 15.5V4.5C3 4.08333 3.14583 3.72917 3.4375 3.4375C3.72917 3.14583 4.08333 3 4.5 3H15.5C15.9167 3 16.2708 3.14583 16.5625 3.4375C16.8542 3.72917 17 4.08333 17 4.5V15.5C17 15.9167 16.8542 16.2708 16.5625 16.5625C16.2708 16.8542 15.9167 17 15.5 17H4.5Z"/>
		</svg>
	);
};

export default IconCodeBlocks;