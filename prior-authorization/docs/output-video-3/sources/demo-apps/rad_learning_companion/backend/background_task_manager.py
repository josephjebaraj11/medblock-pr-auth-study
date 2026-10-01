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

import logging
import threading

logger = logging.getLogger(__name__)


class BackgroundTaskManager:
    """A simple manager to run and track background initialization tasks."""

    def __init__(self):
        self.tasks = {}
        self.results = {}
        self.errors = {}
        self._lock = threading.Lock()

    def _task_wrapper(self, key, target_func, *args, **kwargs):
        """A wrapper to run the target function and store its result or exception."""
        logger.info(f"Background task '{key}' started.")
        try:
            result = target_func(*args, **kwargs)
            with self._lock:
                self.results[key] = result
            logger.info(f"✅ Background task '{key}' finished successfully.")
        except Exception as e:
            with self._lock:
                self.errors[key] = e
            logger.critical(f"❌ Background task '{key}' failed with an exception.", exc_info=True)

    def start_task(self, key, target_func, *args, **kwargs):
        """Starts a new background task in a daemon thread."""
        if key in self.tasks:
            logger.warning(f"Task '{key}' is already running.")
            return

        thread = threading.Thread(
            target=self._task_wrapper,
            args=(key, target_func) + args,
            kwargs=kwargs,
            daemon=True  # Daemon threads exit when the main app exits
        )
        with self._lock:
            self.tasks[key] = thread
        thread.start()

    def is_task_running(self, key):
        """Checks if a specific task is still active."""
        with self._lock:
            return self.tasks.get(key) and self.tasks[key].is_alive()

    def is_task_done(self, key):
        """Checks if a task has completed (successfully or with an error)."""
        with self._lock:
            result = key in self.results or key in self.errors
            if not result:
                logger.info(f"self.results: {self.results}")
                logger.info(f"self.errors: {self.errors}")
            return result

    def get_error(self, key):
        """Returns the exception for a failed task, if any."""
        with self._lock:
            return self.errors.get(key)
