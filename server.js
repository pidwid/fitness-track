import { register } from "ts-node";
import "./config.js"; // Import config first to ensure environment variables are loaded

import "./server/index.ts";
register({ transpileOnly: true });
