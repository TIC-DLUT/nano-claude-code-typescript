import type { Command } from 'commander';
import { runDoctor } from '../handlers/doctor.js';
import type { CliContextFactory, DoctorCommandOptions } from '../types.js';

export function registerDoctorCommand(program: Command, createContext: CliContextFactory): void {
  program
    .command('doctor')
    .description('Validate local CLI runtime configuration')
    .option('--json', 'Output machine-readable JSON logs', false)
    .option('--verbose', 'Enable verbose debug logs', false)
    .action(async (options) => {
      const commandOptions: DoctorCommandOptions = {
        json: Boolean(options.json),
        verbose: Boolean(options.verbose),
      };
      const context = createContext(commandOptions);
      const code = await runDoctor(commandOptions, context);
      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
