import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { BASE_PATH } from "./react-router.config";

export default defineConfig({
  // Must match the React Router basename so assets resolve under the same
  // sub-path the pages are served from.
  base: BASE_PATH,
  plugins: [reactRouter(), tsconfigPaths()],
});
