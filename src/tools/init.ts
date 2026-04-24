import { registerClientTool } from './registry.js';
import { weatherTool } from './schemas/weather.js';
import { weatherHandler } from './handlers/weather.js';
import { readFileTool } from './schemas/read_file.js';
import { readFileHandler } from './handlers/read_file.js';
import { editFileTool } from './schemas/edit_file.js';
import { editFileHandler } from './handlers/edit_file.js';
import { writeFileTool } from './schemas/write_file.js';
import { writeFileHandler } from './handlers/write_file.js';
import { bashTool } from './schemas/bash.js';
import { bashHandler } from './handlers/bash.js';

let initialized = false;

export function initTools(): void {
  if (initialized) return;

  registerClientTool(weatherTool, weatherHandler);
  registerClientTool(readFileTool, readFileHandler);
  registerClientTool(editFileTool, editFileHandler);
  registerClientTool(writeFileTool, writeFileHandler);
  registerClientTool(bashTool, bashHandler);
  initialized = true;
}
