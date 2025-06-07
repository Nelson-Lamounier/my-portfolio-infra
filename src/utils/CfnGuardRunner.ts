import { spawn } from "child_process";
import { ValidationResult } from "../types";
import { Logger } from "./Logger"; // ADD: Import your Logger

/**
 * CfnGuardRunner is a utility class to run the cfn-guard validation tool
 * against CloudFormation templates and rules.
 */
export class CfnGuardRunner {
  /**
   * Validates a CloudFormation template against CFN Guard rules
   * @param templatePath - Path to the CloudFormation template
   * @param rulesPath - Array of paths to CFN Guard rule files
   * @returns Promise<ValidationResult> - Validation results with errors and timing
   */
  async validate(
    templatePath: string,
    rulesPath: string[]
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    // ADD: Log validation start
    Logger.info(`Validating template: ${templatePath}`);
    Logger.debug(`Using ${rulesPath.length} rule(s): ${rulesPath.join(", ")}`);

    try {
      const command = this.buildCommand(templatePath, rulesPath);

      // ADD: Log command being executed
      Logger.debug(`Executing command: ${command.join(" ")}`);

      const executionResult = await this.executeCommand(command);
      const parsedOutput = this.parseOutput(
        executionResult.stdout,
        executionResult.stderr
      );

      const result: ValidationResult = {
        success: parsedOutput.success && executionResult.exitCode === 0,
        template: templatePath,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        exitCode: executionResult.exitCode,
        tool: "cfn-guard",
        duration: Date.now() - startTime,
        errors: parsedOutput.errors,
        rules: rulesPath,
      };

      // ADD: Log validation results
      if (result.success) {
        Logger.success(`Template validation passed in ${result.duration}ms`);
      } else {
        Logger.error(
          `Template validation failed with ${result.errors.length} error(s)`
        );
        result.errors.forEach((error) => Logger.error(`  - ${error}`));
      }

      return result;
    } catch (error) {
      // ADD: Log execution errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`Validation execution failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Builds the command to run cfn-guard with the specified template and rules.
   */
  private buildCommand(templatePath: string, rulesPath: string[]): string[] {
    const command = ["cfn-guard", "validate"];

    command.push("--data", templatePath);

    if (rulesPath.length > 0) {
      rulesPath.forEach((rulePath) => {
        command.push("--rules", rulePath);
      });
    } else {
      // ADD: Log when no rules are provided
      Logger.warn("No validation rules provided");
    }

    return command;
  }

  /**
   * Executes the cfn-guard command and captures its output.
   */
  private executeCommand(
    command: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const [executable, ...args] = command;

      const childProcess = spawn(executable, args, {
        stdio: "pipe",
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (exitCode) => {
        // ADD: Log process completion
        Logger.debug(`Process completed with exit code: ${exitCode}`);
        resolve({
          stdout,
          stderr,
          exitCode: exitCode ?? 0,
        });
      });

      childProcess.on("error", (error) => {
        // ADD: Log process errors
        Logger.error(`Process error: ${error.message}`);
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
    });
  }

  /**
   * Parses the output from cfn-guard to extract errors and determine success.
   */
  private parseOutput(
    stdout: string,
    stderr: string
  ): { errors: string[]; success: boolean } {
    const errors: string[] = [];

    if (stderr && stderr.trim()) {
      errors.push(stderr.trim());
    }

    if (stdout) {
      const lines = stdout.split("\n");
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (
          trimmedLine &&
          (trimmedLine.includes("ERROR") ||
            trimmedLine.includes("FAIL") ||
            trimmedLine.includes("VIOLATION") ||
            trimmedLine.includes("[ERROR]") ||
            trimmedLine.includes("[FAIL]") ||
            trimmedLine.includes("[VIOLATION]"))
        ) {
          errors.push(trimmedLine);
        }
      });
    }

    const success = errors.length === 0;

    // ADD: Log parsing results
    if (errors.length > 0) {
      Logger.debug(`Parsed ${errors.length} error(s) from output`);
    }

    return { errors, success };
  }

  /**
   * Quick validation method for testing purposes
   */
  async quickValidate(
    templatePath: string,
    rulesPath: string[]
  ): Promise<boolean> {
    try {
      const result = await this.validate(templatePath, rulesPath);
      return result.success;
    } catch (error) {
      Logger.error(
        `Quick validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * Get version of cfn-guard being used
   */
  async getVersion(): Promise<string> {
    try {
      Logger.debug("Getting cfn-guard version");
      const result = await this.executeCommand(["cfn-guard", "--version"]);
      const version = result.stdout.trim() || result.stderr.trim();
      Logger.info(`CFN Guard version: ${version}`);
      return version;
    } catch (error) {
      const errorMsg = `Error getting version: ${
        error instanceof Error ? error.message : String(error)
      }`;
      Logger.error(errorMsg);
      return errorMsg;
    }
  }
}
