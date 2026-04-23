import { registerClientTool } from './registry.ts';
import { weatherTool } from './schemas/weather.ts';
import { weatherHandler } from './handlers/weather.ts';
import { readFileTool } from './schemas/read_file.ts';
import { readFileHandler } from './handlers/read_file.ts';

let initialized = false;

export function initTools(): void {
  if (initialized) return;

  registerClientTool(weatherTool, weatherHandler);
  registerClientTool(readFileTool, readFileHandler);
  initialized = true;
}
