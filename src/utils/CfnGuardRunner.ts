import { spawn } from "child_process";
import { ValidationResult } from "../types";
/**
 * CfnGuardRunner is a utility class to run the cfn-guard validation tool
 * against CloudFormation templates and rules.
 */
// This class provides methods to build the command for cfn-guard, execute it,
// and parse the output to return a structured validation result.
// It uses Node.js's child_process module to spawn the cfn-guard command
// and capture its output.
export class CfnGuardRunner {
  async validate(
    templatePath: string,
    rulesPath: string[]
  ): Promise<ValidationResult> {
    const command = this.buildCommand(templatePath, rulesPath);
    const executionResult = await this.executeCommand(command);
    const parsedOutput = this.parseOutput(
      executionResult.stdout,
      executionResult.stderr
    );
    const startTime = Date.now();
    const result: ValidationResult = {
      success: parsedOutput.success && executionResult.exitCode === 0,
      template: templatePath,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      exitCode: executionResult.exitCode,
      tool: "cfn-guard",
      duration: Date.now() - startTime, // Duration can be calculated if needed
      errors: parsedOutput.errors,
    };
    return result;
  }
  /**
   * Builds the command to run cfn-guard with the specified template and rules.
   * @param templatePath - The path to the CloudFormation template file.
   * @param rulesPath - An array of paths to the rules files.
   * @returns An array representing the command to be executed.
   */
  private buildCommand(templatePath: string, rulesPath: string[]): string[] {
    const command = ["cfn-guard", "validate"];
    command.push("--date", templatePath);
    rulesPath.forEach((rulesPath) => {
      command.push("--rules", rulesPath);
    });
    return command;
  }
  /**
   * Executes the cfn-guard command and captures its output.
   * @param command - The command to execute as an array of strings.
   * @returns A promise that resolves with the command's stdout, stderr, and exit code.
   */

  private executeCommand(
    command: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const [executable, ...args] = command;
      const childProcess = spawn(executable, args);
      let stdout = "";
      let stderr = "";
      childProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      childProcess.on("close", (exitCode) => {
        resolve({
          stdout,
          stderr,
          exitCode: exitCode || 0, // Default to 0 if exitCode is undefined})
        });
      });
      childProcess.on("error", (error) => {
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
    });
  }

  /**
   * Parses the output from cfn-guard to extract errors and determine success.
   * @param stdout - The standard output from the command execution.
   * @param stderr - The standard error output from the command execution.
   * @returns An object containing an array of errors and a success flag.
   */

  private parseOutput(
    stdout: string,
    stderr: string
  ): { errors: string[]; success: boolean } {
    const errors: string[] = [];
    if (stderr) {
      errors.push(stderr.trim());
    }
    if (stdout) {
      const lines = stdout.split("\n");
      lines.forEach((line) => {
        if (
          line.includes("ERROR") ||
          line.includes("FAIL") ||
          line.includes("VIOLATION")
        ) {
          const errorMessage = line.trim();
          if (errorMessage) {
            errors.push(errorMessage);
          }
        }
      });
    }
    const success = errors.length === 0;
    return { errors, success };
  }
}
