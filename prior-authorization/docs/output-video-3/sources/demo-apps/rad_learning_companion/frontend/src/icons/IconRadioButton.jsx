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

const IconRadioButton = ({className, ...props}) => {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className} {...props}>
			<path
				d="M12 20C16.4167 20 20 16.4167 20 12C20 7.58333 16.4167 4 12 4C7.58333 4 4 7.58333 4 12C4 16.4167 7.58333 20 12 20ZM12 18C8.68333 18 6 15.3167 6 12C6 8.68333 8.68333 6 12 6C15.3167 6 18 8.68333 18 12C18 15.3167 15.3167 18 12 18Z"
				fill="#444746"/>
		</svg>
	);
};

export default IconRadioButton;