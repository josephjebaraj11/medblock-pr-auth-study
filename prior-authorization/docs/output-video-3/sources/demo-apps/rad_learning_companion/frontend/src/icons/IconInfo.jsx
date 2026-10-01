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

const IconInfo = ({className, ...props}) => {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className} {...props}>
			<path
				d="M9.16667 8.33333H10.8333V6.66667H9.16667V8.33333ZM10 16.6667C5.78333 16.6667 2.5 13.3833 2.5 9.16667C2.5 4.95 5.78333 1.66667 10 1.66667C14.2167 1.66667 17.5 4.95 17.5 9.16667C17.5 13.3833 14.2167 16.6667 10 16.6667ZM10 14.1667C10.4667 14.1667 10.8333 13.7833 10.8333 13.3333V10C10.8333 9.55 10.4667 9.16667 10 9.16667H8.33333C7.88333 9.16667 7.5 9.55 7.5 10C7.5 10.45 7.88333 10.8333 8.33333 10.8333H9.16667V13.3333C9.16667 13.7833 9.53333 14.1667 10 14.1667Z"
				fill="#5F6368"/>
		</svg>
	);
};

export default IconInfo;