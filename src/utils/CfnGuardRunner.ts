import { spawn } from "child_process";
import { ValidationResult } from "../types";

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

  private buildCommand(templatePath: string, rulesPath: string[]): string[] {
    const command = ["cfn-guard", "validate"];
    command.push("--date", templatePath);
    rulesPath.forEach((rulesPath) => {
      command.push("--rules", rulesPath);
    });
    return command;
  }

  private executeCommand(
    command: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  private parseOutput(
    stdout: string,
    stderr: string
  ): { errors: string[]; success: boolean };
}
