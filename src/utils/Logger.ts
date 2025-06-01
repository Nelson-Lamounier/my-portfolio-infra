// Logger utility for consistent logging across the application
// This utility provides methods for logging messages with different severity levels
// such as info, success, error, warn, and debug.
// It uses the 'chalk' library to colorize the output in the console for better visibility.

// let chalkInstance: typeof import("chalk") | undefined;

// async function getChalk() {
//   if (!chalkInstance) {
//     chalkInstance = (await import("chalk")).default;
//   }
//   return chalkInstance;
// }
import chalk from "chalk";

export class Logger {
  static info(message: string): void {
    console.log(`[INFO] ${message}`);
  }
  static success(message: string): void {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }
  static error(message: string): void {
    console.error(chalk.red(`[ERROR] ${message}`));
  }
  static warn(message: string): void {
    console.warn(chalk.yellow(`[WARN] ${message}`));
  }
  static debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }
}
