// tests/helpers/test-runner.ts
import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Simplified test runner for integration tests in personal projects
 * Provides convenient methods for common test scenarios
 */
export class TestCfnGuardRunner {
  private runner: CfnGuardRunner;

  constructor() {
    this.runner = new CfnGuardRunner();
  }

  /**
   * Quick validation for simple test scenarios
   */
  async quickValidate(templatePath: string, rules: string[]): Promise<boolean> {
    try {
      const result = await this.runner.validate(templatePath, rules);
      return result.success;
    } catch (error) {
      // ✅ FIX: Properly handle unknown error type
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`Validation failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get detailed validation results for analysis
   */
  async getValidationDetails(templatePath: string, rules: string[]) {
    return await this.runner.validate(templatePath, rules);
  }

  /**
   * Test if CFN Guard is available (for CI/CD checks)
   */
  async isAvailable(): Promise<boolean> {
    let minimalTemplate: string | null = null;

    try {
      // ✅ IMPROVED: Better path handling and cleanup
      minimalTemplate = path.join(
        os.tmpdir(),
        `cfn-guard-test-${Date.now()}.yml`
      );

      const templateContent = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Minimal test template for CFN Guard availability check'
Resources:
  TestResource:
    Type: AWS::CloudFormation::WaitConditionHandle
`.trim();

      fs.writeFileSync(minimalTemplate, templateContent);

      // Test with empty rules array (just check if cfn-guard command works)
      const result = await this.runner.validate(minimalTemplate, []);

      return true; // If we got here, CFN Guard is working
    } catch (error) {
      // ✅ FIX: Properly handle unknown error type
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.debug(`CFN Guard availability check failed: ${errorMessage}`);
      return false;
    } finally {
      // ✅ IMPROVED: Always clean up temp file
      if (minimalTemplate && fs.existsSync(minimalTemplate)) {
        try {
          fs.unlinkSync(minimalTemplate);
        } catch (cleanupError) {
          const errorMessage =
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError);
          console.warn(
            `Failed to clean up temp file ${minimalTemplate}: ${errorMessage}`
          );
        }
      }
    }
  }

  /**
   * ✅ NEW: Batch validation for multiple templates
   */
  async validateBatch(
    templatePaths: string[],
    rules: string[],
    options: {
      stopOnFirstFailure?: boolean;
      logProgress?: boolean;
    } = {}
  ): Promise<{
    results: Array<{
      template: string;
      success: boolean;
      errors: string[];
      duration: number;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalErrors: number;
    };
  }> {
    const results = [];
    let totalErrors = 0;

    for (const templatePath of templatePaths) {
      try {
        if (options.logProgress) {
          console.log(`Validating: ${path.basename(templatePath)}`);
        }

        const result = await this.runner.validate(templatePath, rules);

        const templateResult = {
          template: path.basename(templatePath),
          success: result.success,
          errors: result.errors || [],
          duration: result.duration || 0,
        };

        results.push(templateResult);
        totalErrors += templateResult.errors.length;

        if (!result.success && options.stopOnFirstFailure) {
          break;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const templateResult = {
          template: path.basename(templatePath),
          success: false,
          errors: [`Validation failed: ${errorMessage}`],
          duration: 0,
        };

        results.push(templateResult);
        totalErrors += 1;

        if (options.stopOnFirstFailure) {
          break;
        }
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalErrors,
    };

    return { results, summary };
  }

  /**
   * ✅ NEW: Quick health check for your infrastructure testing
   */
  async healthCheck(): Promise<{
    cfnGuardAvailable: boolean;
    nodeVersion: string;
    platform: string;
    recommendations: string[];
  }> {
    const health = {
      cfnGuardAvailable: false,
      nodeVersion: process.version,
      platform: process.platform,
      recommendations: [] as string[],
    };

    try {
      health.cfnGuardAvailable = await this.isAvailable();

      if (!health.cfnGuardAvailable) {
        health.recommendations.push(
          "Install CFN Guard: https://github.com/aws-cloudformation/cloudformation-guard"
        );
      }

      // Check Node.js version (CFN Guard works best with Node 16+)
      const nodeVersionNumber = parseInt(
        process.version.substring(1).split(".")[0]
      );
      if (nodeVersionNumber < 16) {
        health.recommendations.push(
          "Consider upgrading to Node.js 16+ for better CFN Guard compatibility"
        );
      }

      if (health.platform === "win32") {
        health.recommendations.push(
          "On Windows, ensure CFN Guard is in your PATH"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      health.recommendations.push(`Health check error: ${errorMessage}`);
    }

    return health;
  }
}

// ✅ ENHANCED: Export both class and singleton
export const testRunner = new TestCfnGuardRunner();

// ✅ NEW: Convenience functions for common operations
export async function quickValidate(
  templatePath: string,
  rules: string[]
): Promise<boolean> {
  return testRunner.quickValidate(templatePath, rules);
}

export async function isCfnGuardAvailable(): Promise<boolean> {
  return testRunner.isAvailable();
}

export async function validateMultipleTemplates(
  templatePaths: string[],
  rules: string[]
): Promise<boolean> {
  const result = await testRunner.validateBatch(templatePaths, rules);
  return result.summary.failed === 0;
}
