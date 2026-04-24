import { registerClientTool } from './registry.js';
import { weatherTool } from './schemas/weather.js';
import { weatherHandler } from './handlers/weather.js';
import { readFileTool } from './schemas/read_file.js';
import { readFileHandler } from './handlers/read_file.js';

let initialized = false;

export function initTools(): void {
  if (initialized) return;

  registerClientTool(weatherTool, weatherHandler);
  registerClientTool(readFileTool, readFileHandler);
  initialized = true;
}
