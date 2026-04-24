import type { Command } from 'commander';
import { runDoctor } from '../handlers/doctor.ts';

export function registerDoctorCommand(program: Command): void {
  program.command('doctor').description('Validate local CLI runtime configuration').action(async () => {
    const code = await runDoctor();
    if (code !== 0) {
      process.exitCode = code;
    }
  });
}
