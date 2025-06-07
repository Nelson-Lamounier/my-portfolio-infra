import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";

// ===== ENHANCED INTERFACES =====
interface ValidationOptions {
  useRain?: boolean;
  timeout?: number;
  failFast?: boolean;
  logLevel?: "minimal" | "detailed";
}

interface ValidationResult {
  success: boolean;
  rainValid?: boolean;
  guardErrors: string[];
  duration: number;
  template: string;
  rulesApplied: number;
}

// ===== MAIN VALIDATOR CLASS =====
/**
 * Simplified validator for personal CloudFormation projects
 * Combines Rain syntax validation with CFN Guard security rules
 */
export class TemplateValidator {
  private static cfnGuardPath = path.join(__dirname, "../../cfn-guard");
  private static projectRoot = path.join(__dirname, "../../");

  // ===== PRESERVE YOUR EXISTING LOGIC =====
  static getRulesByCategory(category: string): string[] {
    const categoryPath = path.join(this.cfnGuardPath, "rules", category);
    if (!fs.existsSync(categoryPath)) {
      console.warn(
        `  Rules category '${category}' not found at ${categoryPath}`
      );
      return [];
    }

    return fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".guard"))
      .map((file) => path.join(categoryPath, file));
  }

  static getAllRules(): string[] {
    const rulesPath = path.join(this.cfnGuardPath, "rules");
    const allRules: string[] = [];

    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith(".guard")) {
          allRules.push(fullPath);
        }
      });
    };

    scanDirectory(rulesPath);
    return allRules;
  }

  // ===== ENHANCED VALIDATION METHOD =====
  /**
   * Main validation method - combines Rain + CFN Guard
   * Perfect for personal projects: simple interface, comprehensive validation
   */
  static async validateTemplate(
    templatePath: string,
    ruleCategories: string[] = ["security"],
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const start = Date.now();
    const absolutePath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(this.projectRoot, templatePath);

    console.log(
      `[VALIDATE] Validating: ${path.relative(this.projectRoot, absolutePath)}`
    );

    let success = true;
    let rainValid = true;
    const guardErrors: string[] = [];
    let rulesApplied = 0;

    // ===== RAIN VALIDATION (Syntax Check) =====
    if (options.useRain) {
      try {
        console.log(`  [RAIN] Running Rain syntax check...`);
        execSync(`rain validate "${absolutePath}"`, {
          stdio: options.logLevel === "detailed" ? "inherit" : "pipe",
          timeout: options.timeout || 10000,
        });
        console.log(`  [RAIN] Rain validation passed`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        rainValid = false;
        success = false;
        console.log(`  [RAIN] Rain validation failed`);
        if (options.logLevel === "detailed") {
          console.error(errorMessage);
        }
        if (options.failFast) {
          return {
            success: false,
            rainValid: false,
            guardErrors: ["Rain validation failed"],
            duration: Date.now() - start,
            template: path.basename(absolutePath),
            rulesApplied: 0,
          };
        }
      }
    }

    // ===== CFN GUARD VALIDATION (Security Rules) =====
    if (ruleCategories.length > 0) {
      try {
        const runner = new CfnGuardRunner();
        const rules: string[] = [];

        // Collect rules from categories
        ruleCategories.forEach((category) => {
          const categoryRules = this.getRulesByCategory(category);
          rules.push(...categoryRules);
          console.log(
            `  [GUARD] Loaded ${categoryRules.length} rules from '${category}' category`
          );
        });

        rulesApplied = rules.length;

        if (rules.length === 0) {
          console.warn(
            `  [GUARD] No rules found for categories: ${ruleCategories.join(
              ", "
            )}`
          );
        } else {
          console.log(`  [GUARD] Running ${rules.length} security rules...`);
          const result = await runner.validate(absolutePath, rules);

          if (!result.success) {
            success = false;
            guardErrors.push(...result.errors);
          }

          if (options.logLevel === "detailed") {
            console.log(`  [GUARD] CFN Guard Results:`);
            console.log(`    Success: ${result.success}`);
            console.log(`    Errors: ${result.errors.length}`);
            console.log(`    Duration: ${result.duration}ms`);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        success = false;
        guardErrors.push(`CFN Guard validation failed: ${errorMessage}`);
        console.log(`  [GUARD] CFN Guard validation failed: ${errorMessage}`);
      }
    }

    const duration = Date.now() - start;
    console.log(`  [TIMING] Completed in ${duration}ms\n`);

    return {
      success,
      rainValid,
      guardErrors,
      duration,
      template: path.basename(absolutePath),
      rulesApplied,
    };
  }

  // ===== CONVENIENCE METHODS FOR PERSONAL PROJECTS =====

  /**
   * Quick validation for development workflow
   * Uses sensible defaults for personal projects
   */
  static async quickValidate(templatePath: string): Promise<boolean> {
    const result = await this.validateTemplate(
      templatePath,
      ["security", "baseline"], // Essential categories only
      {
        useRain: true,
        logLevel: "minimal",
        failFast: true,
      }
    );
    return result.success;
  }

  /**
   * Comprehensive validation for CI/CD or thorough checking
   */
  static async fullValidate(templatePath: string): Promise<ValidationResult> {
    return this.validateTemplate(
      templatePath,
      ["security", "baseline", "networking", "compute", "iam"],
      {
        useRain: true,
        logLevel: "detailed",
        timeout: 30000,
      }
    );
  }

  /**
   * Batch validate multiple templates (perfect for personal projects)
   */
  static async validateBatch(
    templatePaths: string[],
    ruleCategories: string[] = ["security"]
  ): Promise<ValidationResult[]> {
    console.log(
      `\n[BATCH] Batch validating ${templatePaths.length} templates...\n`
    );

    const results: ValidationResult[] = [];

    for (const templatePath of templatePaths) {
      const result = await this.validateTemplate(templatePath, ruleCategories, {
        useRain: true,
        logLevel: "minimal",
      });
      results.push(result);
    }

    // Summary report
    const successful = results.filter((r) => r.success).length;
    const totalErrors = results.reduce(
      (sum, r) => sum + r.guardErrors.length,
      0
    );

    console.log(`\n[BATCH] Batch Validation Summary:`);
    console.log(`  Templates: ${results.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${results.length - successful}`);
    console.log(`  Total Issues: ${totalErrors}`);

    return results;
  }

  // ===== CRITICAL VALIDATION FOR CI/CD =====
  /**
   * Critical rules that must pass for deployment
   * Extracted from your ci-validation.test.ts
   */
  private static getCriticalRules(): string[] {
    return [
      "cfn-guard/rules/baseline/security-baseline.guard",
      "cfn-guard/rules/iam/iam-security.guard",
      "cfn-guard/rules/kms/encryption-security.guard",
    ]
      .map((rule) => path.join(this.projectRoot, rule))
      .filter((rule) => fs.existsSync(rule));
  }

  /**
   * Validate templates with critical rules only
   * Perfect for CI/CD pipelines - fails fast on security issues
   */
  static async validateCritical(
    templatePath: string
  ): Promise<ValidationResult> {
    console.log(
      `[CRITICAL] Running CRITICAL validation for: ${path.basename(
        templatePath
      )}`
    );

    const runner = new CfnGuardRunner();
    const criticalRules = this.getCriticalRules();
    const absolutePath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(this.projectRoot, templatePath);

    if (criticalRules.length === 0) {
      console.warn(
        `[CRITICAL] No critical rules found! Check your cfn-guard/rules/ directory`
      );
      return {
        success: false,
        guardErrors: ["No critical rules available"],
        duration: 0,
        template: path.basename(templatePath),
        rulesApplied: 0,
      };
    }

    console.log(
      `[CRITICAL] Applying ${criticalRules.length} critical security rules...`
    );
    const start = Date.now();

    try {
      const result = await runner.validate(absolutePath, criticalRules);
      const duration = Date.now() - start;

      if (!result.success) {
        console.error(
          `[CRITICAL] ${path.basename(
            templatePath
          )} FAILED critical validation:`
        );
        result.errors.forEach((error) => console.error(`  [ERROR] ${error}`));
        console.error(
          `[CRITICAL] This template CANNOT be deployed until issues are fixed!\n`
        );
      } else {
        console.log(
          `[CRITICAL] ${path.basename(templatePath)} passed all critical rules`
        );
        console.log(`[CRITICAL] Template is safe for deployment\n`);
      }

      return {
        success: result.success,
        guardErrors: result.errors,
        duration,
        template: path.basename(templatePath),
        rulesApplied: criticalRules.length,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[CRITICAL] Critical validation failed: ${errorMessage}`);

      return {
        success: false,
        guardErrors: [`Validation error: ${errorMessage}`],
        duration,
        template: path.basename(templatePath),
        rulesApplied: criticalRules.length,
      };
    }
  }

  /**
   * Batch critical validation for CI/CD
   * Preserves your original logic but simplified
   */
  static async validateAllCritical(templatePaths: string[]): Promise<{
    success: boolean;
    results: ValidationResult[];
    failedTemplates: string[];
  }> {
    console.log(`\n[CRITICAL] CRITICAL VALIDATION PIPELINE`);
    console.log(
      `[CRITICAL] Validating ${templatePaths.length} templates with critical rules\n`
    );

    const results: ValidationResult[] = [];
    const failedTemplates: string[] = [];

    for (const templatePath of templatePaths) {
      const result = await this.validateCritical(templatePath);
      results.push(result);

      if (!result.success) {
        failedTemplates.push(result.template);
      }
    }

    // Summary for CI/CD
    const success = failedTemplates.length === 0;
    console.log(`[CRITICAL] CRITICAL VALIDATION SUMMARY:`);
    console.log(`  Total Templates: ${results.length}`);
    console.log(`  Passed: ${results.length - failedTemplates.length}`);
    console.log(`  Failed: ${failedTemplates.length}`);

    if (failedTemplates.length > 0) {
      console.error(`\n[CRITICAL] DEPLOYMENT BLOCKED! Failed templates:`);
      failedTemplates.forEach((template) =>
        console.error(`  [FAILED] ${template}`)
      );
      console.error(
        `\n[CRITICAL] Fix these critical security issues before deploying.\n`
      );
    } else {
      console.log(`\n[CRITICAL] All templates passed critical validation!`);
      console.log(`[CRITICAL] Ready for deployment\n`);
    }

    return {
      success,
      results,
      failedTemplates,
    };
  }

  // ===== ENHANCED TEMPLATE DISCOVERY =====
  /**
   * Enhanced template discovery - extracted from cloudformation-validation.integration.test.ts
   * More comprehensive than your original discover-templates.ts
   */
  static discoverTemplates(baseDir: string = this.projectRoot): string[] {
    console.log(
      `[DISCOVERY] Discovering CloudFormation templates in: ${baseDir}`
    );
    const templates: string[] = [];

    // Common CloudFormation directory names (from your original file)
    const searchDirectories = [
      path.join(baseDir, "cloudformation"),
      path.join(baseDir, "templates"),
      path.join(baseDir, "infrastructure"),
      path.join(baseDir, "cfn"),
      path.join(baseDir, "aws"),
      path.join(baseDir, "stacks"),
      baseDir, // Also search root directory
    ];

    searchDirectories.forEach((dir) => {
      if (fs.existsSync(dir)) {
        console.log(`  [DISCOVERY] Scanning: ${path.relative(baseDir, dir)}`);
        const foundTemplates = TemplateValidator.scanForTemplates(dir);
        templates.push(...foundTemplates);
        console.log(`    [DISCOVERY] Found ${foundTemplates.length} templates`);
      }
    });

    // Remove duplicates and sort
    const uniqueTemplates = [...new Set(templates)].sort();
    console.log(
      `\n[DISCOVERY] Discovery Summary: ${uniqueTemplates.length} unique templates found\n`
    );

    return uniqueTemplates;
  }

  /**
   * Recursive template scanning - preserves your original logic
   */
  private static scanForTemplates(dir: string): string[] {
    const templates: string[] = [];

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        // Skip hidden files and common ignore patterns
        if (
          item.startsWith(".") ||
          item === "node_modules" ||
          item === "dist"
        ) {
          return;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursive search subdirectories (preserves your logic)
          templates.push(...this.scanForTemplates(fullPath));
        } else {
          // Check if file is a CloudFormation template
          if (this.isCloudFormationTemplate(fullPath)) {
            templates.push(fullPath);
          }
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[DISCOVERY] Could not scan directory ${dir}: ${errorMessage}`
      );
    }

    return templates;
  }

  /**
   * Enhanced CloudFormation detection - preserves your original logic with improvements
   */
  private static isCloudFormationTemplate(filePath: string): boolean {
    try {
      // Check file extension first (quick filter)
      const ext = path.extname(filePath).toLowerCase();
      if (![".yml", ".yaml", ".json"].includes(ext)) {
        return false;
      }

      const content = fs.readFileSync(filePath, "utf8");

      // Enhanced CloudFormation indicators (from your original + improvements)
      const cfnIndicators = [
        "AWSTemplateFormatVersion",
        "Resources:",
        "Parameters:",
        "Outputs:",
        "Mappings:",
        "Conditions:",
        "Type: AWS::",
        'Type: "AWS::',
        '"Type": "AWS::',
        "Ref:",
        "Fn::",
        "!Ref",
        "!GetAtt",
      ];

      return cfnIndicators.some((indicator) => content.includes(indicator));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[DISCOVERY] Could not read file ${filePath}: ${errorMessage}`
      );
      return false;
    }
  }

  /**
   * Get templates by category/domain for organized testing
   */
  static getTemplatesByDomain(): { [domain: string]: string[] } {
    const allTemplates = this.discoverTemplates();
    const domains: { [domain: string]: string[] } = {
      networking: [],
      compute: [],
      security: [],
      storage: [],
      pipelines: [],
      monitoring: [],
      other: [],
    };

    allTemplates.forEach((template) => {
      const relativePath = path
        .relative(this.projectRoot, template)
        .toLowerCase();

      if (
        relativePath.includes("network") ||
        relativePath.includes("vpc") ||
        relativePath.includes("subnet")
      ) {
        domains.networking.push(template);
      } else if (
        relativePath.includes("compute") ||
        relativePath.includes("ec2") ||
        relativePath.includes("ecs") ||
        relativePath.includes("autoscaling")
      ) {
        domains.compute.push(template);
      } else if (
        relativePath.includes("security") ||
        relativePath.includes("iam") ||
        relativePath.includes("kms")
      ) {
        domains.security.push(template);
      } else if (
        relativePath.includes("storage") ||
        relativePath.includes("s3") ||
        relativePath.includes("rds")
      ) {
        domains.storage.push(template);
      } else if (
        relativePath.includes("pipeline") ||
        relativePath.includes("cicd") ||
        relativePath.includes("codebuild")
      ) {
        domains.pipelines.push(template);
      } else if (
        relativePath.includes("monitoring") ||
        relativePath.includes("cloudwatch") ||
        relativePath.includes("logs")
      ) {
        domains.monitoring.push(template);
      } else {
        domains.other.push(template);
      }
    });

    return domains;
  }

  // ===== RULE CATEGORY TESTING (preserved from rule-categories.test.ts) =====

  /**
   * Test individual rule categories - preserves your original logic
   */
  static async testRuleCategory(
    category: string,
    templatePath: string,
    options: { logResults?: boolean } = {}
  ): Promise<ValidationResult> {
    const rules = this.getRulesByCategory(category);

    if (rules.length === 0) {
      console.warn(`[RULES] No rules found for category '${category}'`);
      return {
        success: false,
        guardErrors: [`No rules found for category '${category}'`],
        duration: 0,
        template: path.basename(templatePath),
        rulesApplied: 0,
      };
    }

    console.log(
      `[RULES] Testing rule category '${category}' (${rules.length} rules)`
    );

    const runner = new CfnGuardRunner();
    const start = Date.now();

    try {
      const result = await runner.validate(templatePath, rules);
      const duration = Date.now() - start;

      // Preserve your original logging format
      if (options.logResults) {
        console.log(
          `[RULES] ${
            category.charAt(0).toUpperCase() + category.slice(1)
          } Security Results:`,
          {
            success: result.success,
            errors: result.errors.length,
            duration: result.duration,
          }
        );
      }

      return {
        success: result.success,
        guardErrors: result.errors,
        duration,
        template: path.basename(templatePath),
        rulesApplied: rules.length,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[RULES] Rule category '${category}' testing failed: ${errorMessage}`
      );

      return {
        success: false,
        guardErrors: [`Rule testing failed: ${errorMessage}`],
        duration,
        template: path.basename(templatePath),
        rulesApplied: rules.length,
      };
    }
  }

  /**
   * Test multiple rule categories together - preserves your multi-category logic
   */
  static async testMultipleCategories(
    categories: string[],
    templatePath: string
  ): Promise<ValidationResult & { categoriesUsed: string[] }> {
    console.log(
      `[RULES] Testing multiple rule categories: ${categories.join(", ")}`
    );

    const allRules: string[] = [];
    const validCategories: string[] = [];

    // Collect rules from all categories (preserves your logic)
    categories.forEach((category) => {
      const categoryRules = this.getRulesByCategory(category);
      if (categoryRules.length > 0) {
        allRules.push(...categoryRules);
        validCategories.push(category);
        console.log(`  [RULES] ${category}: ${categoryRules.length} rules`);
      } else {
        console.warn(`  [RULES] No rules found for category '${category}'`);
      }
    });

    if (allRules.length === 0) {
      return {
        success: false,
        guardErrors: ["No rules found in any category"],
        duration: 0,
        template: path.basename(templatePath),
        rulesApplied: 0,
        categoriesUsed: [],
      };
    }

    const runner = new CfnGuardRunner();
    const start = Date.now();

    try {
      const result = await runner.validate(templatePath, allRules);
      const duration = Date.now() - start;

      // Preserve your original logging format
      console.log("[RULES] Multi-Category Results:", {
        success: result.success,
        errorsCount: result.errors.length,
        duration: result.duration,
        categoriesUsed: validCategories.length,
      });

      return {
        success: result.success,
        guardErrors: result.errors,
        duration,
        template: path.basename(templatePath),
        rulesApplied: allRules.length,
        categoriesUsed: validCategories,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        guardErrors: [`Multi-category validation failed: ${errorMessage}`],
        duration,
        template: path.basename(templatePath),
        rulesApplied: allRules.length,
        categoriesUsed: validCategories,
      };
    }
  }

  /**
   * Verify rule categories are properly organized and accessible
   */
  static verifyRuleCategories(): { [category: string]: number } {
    const rulesPath = path.join(this.cfnGuardPath, "rules");
    const categories: { [category: string]: number } = {};

    if (!fs.existsSync(rulesPath)) {
      console.error(`[RULES] Rules directory not found: ${rulesPath}`);
      return {};
    }

    try {
      const categoryDirs = fs.readdirSync(rulesPath).filter((item) => {
        const fullPath = path.join(rulesPath, item);
        return fs.statSync(fullPath).isDirectory();
      });

      categoryDirs.forEach((category) => {
        const rules = this.getRulesByCategory(category);
        categories[category] = rules.length;
      });

      console.log(`\n[RULES] Available rule categories:`);
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} rules`);
      });

      return categories;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[RULES] Error scanning rule categories: ${errorMessage}`);
      return {};
    }
  }

  // ===== SECURITY-FOCUSED RULE TESTING (preserved from rule-validation.test.ts) =====

  /**
   * Test security-focused rule combinations - preserves your original logic
   */
  static async validateSecurityFocused(
    templatePath: string,
    options: { logResults?: boolean } = {}
  ): Promise<ValidationResult & { securityCategories: string[] }> {
    // Preserve your original security-focused categories
    const securityCategories = ["baseline", "networking", "iam"];

    console.log(
      `[SECURITY] Security-focused validation with categories: ${securityCategories.join(
        ", "
      )}`
    );

    const result = await this.validateTemplate(
      templatePath,
      securityCategories,
      { logLevel: options.logResults ? "detailed" : "minimal" }
    );

    // Preserve your original logging format
    if (options.logResults) {
      console.log("[SECURITY] Security Validation:", {
        success: result.success,
        errorCount: result.guardErrors.length,
        duration: `${result.duration}ms`,
      });
    }

    return {
      ...result,
      securityCategories,
    };
  }

  /**
   * Test all available rules - preserves your complete validation logic
   */
  static async validateWithAllRules(
    templatePath: string,
    options: { logResults?: boolean } = {}
  ): Promise<ValidationResult & { totalRulesUsed: number }> {
    console.log(`[SECURITY] Complete validation with all available rules`);

    const allRules = this.getAllRules();

    if (allRules.length === 0) {
      console.warn(`[SECURITY] No rules found in cfn-guard/rules/ directory`);
      return {
        success: false,
        guardErrors: ["No rules available"],
        duration: 0,
        template: path.basename(templatePath),
        rulesApplied: 0,
        totalRulesUsed: 0,
      };
    }

    // Preserve your original logging
    if (options.logResults) {
      console.log(
        `[SECURITY] Found ${allRules.length} rule files:`,
        allRules
          .map((rule) => path.relative(this.projectRoot, rule))
          .slice(0, 5)
      );
      if (allRules.length > 5) {
        console.log(`  ... and ${allRules.length - 5} more rules`);
      }
    }

    const runner = new CfnGuardRunner();
    const start = Date.now();

    try {
      const result = await runner.validate(templatePath, allRules);
      const duration = Date.now() - start;

      // Preserve your original logging format
      if (options.logResults) {
        console.log("[SECURITY] Complete Validation:", {
          success: result.success,
          errorCount: result.errors.length,
          rulesCount: allRules.length,
          duration: `${duration}ms`,
        });
      }

      return {
        success: result.success,
        guardErrors: result.errors,
        duration,
        template: path.basename(templatePath),
        rulesApplied: allRules.length,
        totalRulesUsed: allRules.length,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[SECURITY] Complete validation failed: ${errorMessage}`);

      return {
        success: false,
        guardErrors: [`Complete validation failed: ${errorMessage}`],
        duration,
        template: path.basename(templatePath),
        rulesApplied: allRules.length,
        totalRulesUsed: allRules.length,
      };
    }
  }

  /**
   * Test progressive rule complexity - useful for debugging rule issues
   */
  static async validateProgressive(templatePath: string): Promise<{
    baseline: ValidationResult;
    security: ValidationResult;
    comprehensive: ValidationResult;
    summary: {
      totalTests: number;
      successfulTests: number;
      totalIssues: number;
    };
  }> {
    console.log(
      `[PROGRESSIVE] Progressive validation: Baseline -> Security -> Comprehensive`
    );

    // Test baseline rules first
    const baseline = await this.validateTemplate(templatePath, ["baseline"], {
      logLevel: "minimal",
    });
    console.log(
      `  [PROGRESSIVE] 1. Baseline: ${baseline.success ? "PASS" : "FAIL"} (${
        baseline.guardErrors.length
      } issues)`
    );

    // Test security-focused rules
    const security = await this.validateSecurityFocused(templatePath, {
      logResults: false,
    });
    console.log(
      `  [PROGRESSIVE] 2. Security: ${security.success ? "PASS" : "FAIL"} (${
        security.guardErrors.length
      } issues)`
    );

    // Test all rules
    const comprehensive = await this.validateWithAllRules(templatePath, {
      logResults: false,
    });
    console.log(
      `  [PROGRESSIVE] 3. Comprehensive: ${
        comprehensive.success ? "PASS" : "FAIL"
      } (${comprehensive.guardErrors.length} issues)`
    );

    const summary = {
      totalTests: 3,
      successfulTests: [baseline, security, comprehensive].filter(
        (r) => r.success
      ).length,
      totalIssues:
        baseline.guardErrors.length +
        security.guardErrors.length +
        comprehensive.guardErrors.length,
    };

    console.log(`\n[PROGRESSIVE] Progressive Validation Summary:`);
    console.log(
      `  Tests Passed: ${summary.successfulTests}/${summary.totalTests}`
    );
    console.log(`  Total Issues: ${summary.totalIssues}`);

    return { baseline, security, comprehensive, summary };
  }

  // ===== SECURITY ANALYSIS (preserved from security-analysis.test.ts) =====

  /**
   * Detailed security issue analysis - preserves your original logic
   */
  static async analyzeSecurityIssues(
    templatePath: string,
    options: {
      detailed?: boolean;
      maxIssues?: number;
      categorize?: boolean;
    } = {}
  ): Promise<{
    template: string;
    criticalIssues: string[];
    issueCategories: { [category: string]: string[] };
    severity: "low" | "medium" | "high" | "critical";
    recommendations: string[];
    duration: number;
  }> {
    const templateName = path.basename(templatePath);
    console.log(`\n[ANALYSIS] Analyzing: ${templateName}`);
    console.log("-".repeat(50));

    // Preserve your original critical rules selection
    const criticalRules = [
      "cfn-guard/rules/baseline/security-baseline.guard",
      "cfn-guard/rules/iam/iam-security.guard",
      "cfn-guard/rules/networking/networking-security.guard",
    ]
      .map((rule) => path.join(this.projectRoot, rule))
      .filter((rule) => fs.existsSync(rule));

    const runner = new CfnGuardRunner();
    const start = Date.now();

    try {
      const result = await runner.validate(templatePath, criticalRules);
      const duration = Date.now() - start;

      // Preserve your original output format
      if (result.errors.length > 0) {
        console.log(`[ANALYSIS] Found ${result.errors.length} issues:`);
        const issuesToShow = options.maxIssues
          ? result.errors.slice(0, options.maxIssues)
          : result.errors;

        issuesToShow.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });

        if (options.maxIssues && result.errors.length > options.maxIssues) {
          console.log(
            `   ... and ${result.errors.length - options.maxIssues} more issues`
          );
        }
      } else {
        console.log("[ANALYSIS] No critical issues found");
      }

      // Enhanced: Categorize issues by type
      const issueCategories = options.categorize
        ? this.categorizeSecurityIssues(result.errors)
        : {};

      // Enhanced: Determine severity level
      const severity = this.determineSeverity(
        result.errors.length,
        templateName
      );

      // Enhanced: Generate recommendations
      const recommendations = this.generateSecurityRecommendations(
        result.errors,
        templateName
      );

      return {
        template: templateName,
        criticalIssues: result.errors,
        issueCategories,
        severity,
        recommendations,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[ANALYSIS] Analysis failed for ${templateName}: ${errorMessage}`
      );

      return {
        template: templateName,
        criticalIssues: [`Analysis failed: ${errorMessage}`],
        issueCategories: {},
        severity: "critical",
        recommendations: ["Fix analysis errors before proceeding"],
        duration,
      };
    }
  }

  /**
   * Batch security analysis - preserves your original batch approach
   */
  static async analyzeBatchSecurity(
    templatePaths: string[],
    options: {
      detailedAnalysis?: boolean;
      limitTemplates?: number;
    } = {}
  ): Promise<{
    analyses: any[];
    summary: {
      totalTemplates: number;
      templatesWithIssues: number;
      totalIssues: number;
      highRiskTemplates: string[];
      recommendations: string[];
    };
  }> {
    console.log("\n" + "=".repeat(80));
    console.log("[ANALYSIS] DETAILED SECURITY ISSUE ANALYSIS");
    console.log("=".repeat(80));

    // Preserve your original logic - analyze limited number for detailed review
    const templatesToAnalyze = options.limitTemplates
      ? templatePaths.slice(0, options.limitTemplates)
      : templatePaths;

    console.log(
      `[ANALYSIS] Analyzing ${templatesToAnalyze.length} templates for security issues...\n`
    );

    const analyses = [];
    const highRiskTemplates = [];
    let totalIssues = 0;

    for (const templatePath of templatesToAnalyze) {
      const analysis = await this.analyzeSecurityIssues(templatePath, {
        detailed: options.detailedAnalysis,
        maxIssues: options.detailedAnalysis ? undefined : 5,
        categorize: true,
      });

      analyses.push(analysis);
      totalIssues += analysis.criticalIssues.length;

      if (analysis.severity === "high" || analysis.severity === "critical") {
        highRiskTemplates.push(analysis.template);
      }
    }

    // Generate overall recommendations
    const overallRecommendations = this.generateBatchRecommendations(analyses);

    const summary = {
      totalTemplates: templatesToAnalyze.length,
      templatesWithIssues: analyses.filter((a) => a.criticalIssues.length > 0)
        .length,
      totalIssues,
      highRiskTemplates,
      recommendations: overallRecommendations,
    };

    // Preserve your original summary format
    console.log("\n" + "=".repeat(80));
    console.log("[ANALYSIS] SECURITY ANALYSIS SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total templates analyzed: ${summary.totalTemplates}`);
    console.log(`Templates with issues: ${summary.templatesWithIssues}`);
    console.log(`Total critical issues: ${summary.totalIssues}`);

    if (highRiskTemplates.length > 0) {
      console.log(
        `\n[ANALYSIS] High-risk templates requiring immediate attention:`
      );
      highRiskTemplates.forEach((template) =>
        console.log(`  [HIGH-RISK] ${template}`)
      );
    }

    if (summary.recommendations.length > 0) {
      console.log(`\n[ANALYSIS] Recommendations:`);
      summary.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    return { analyses, summary };
  }

  // ===== HELPER METHODS FOR ENHANCED ANALYSIS =====

  private static categorizeSecurityIssues(errors: string[]): {
    [category: string]: string[];
  } {
    const categories = {
      iam: [] as string[],
      networking: [] as string[],
      encryption: [] as string[],
      access: [] as string[],
      compliance: [] as string[],
      other: [] as string[],
    };

    errors.forEach((error) => {
      const lowerError = error.toLowerCase();

      if (
        lowerError.includes("iam") ||
        lowerError.includes("role") ||
        lowerError.includes("policy")
      ) {
        categories.iam.push(error);
      } else if (
        lowerError.includes("network") ||
        lowerError.includes("security group") ||
        lowerError.includes("vpc")
      ) {
        categories.networking.push(error);
      } else if (
        lowerError.includes("encrypt") ||
        lowerError.includes("kms") ||
        lowerError.includes("ssl") ||
        lowerError.includes("tls")
      ) {
        categories.encryption.push(error);
      } else if (
        lowerError.includes("public") ||
        lowerError.includes("access") ||
        lowerError.includes("permission")
      ) {
        categories.access.push(error);
      } else if (
        lowerError.includes("compliance") ||
        lowerError.includes("baseline") ||
        lowerError.includes("standard")
      ) {
        categories.compliance.push(error);
      } else {
        categories.other.push(error);
      }
    });

    // Return only categories with issues
    return Object.fromEntries(
      Object.entries(categories).filter(([_, issues]) => issues.length > 0)
    );
  }

  private static determineSeverity(
    issueCount: number,
    templateName: string
  ): "low" | "medium" | "high" | "critical" {
    // Security templates should have very few issues
    if (
      templateName.includes("security") ||
      templateName.includes("iam") ||
      templateName.includes("kms")
    ) {
      return issueCount === 0 ? "low" : issueCount <= 2 ? "medium" : "critical";
    }

    // Core infrastructure should be very clean
    if (templateName.includes("vpc") || templateName.includes("core")) {
      return issueCount === 0
        ? "low"
        : issueCount <= 3
        ? "medium"
        : issueCount <= 7
        ? "high"
        : "critical";
    }

    // General templates
    return issueCount === 0
      ? "low"
      : issueCount <= 5
      ? "medium"
      : issueCount <= 15
      ? "high"
      : "critical";
  }

  private static generateSecurityRecommendations(
    errors: string[],
    templateName: string
  ): string[] {
    const recommendations = [];

    if (errors.length === 0) {
      recommendations.push(
        "[OK] Template meets critical security requirements"
      );
      return recommendations;
    }

    // General recommendations based on issue patterns
    const errorText = errors.join(" ").toLowerCase();

    if (errorText.includes("iam") || errorText.includes("policy")) {
      recommendations.push(
        "[IAM] Review IAM policies for least privilege principles"
      );
    }

    if (errorText.includes("public") || errorText.includes("open")) {
      recommendations.push(
        "[ACCESS] Restrict public access and review security groups"
      );
    }

    if (errorText.includes("encrypt")) {
      recommendations.push(
        "[ENCRYPTION] Enable encryption for all data at rest and in transit"
      );
    }

    if (errorText.includes("network") || errorText.includes("vpc")) {
      recommendations.push("[NETWORK] Review network security configurations");
    }

    // Template-specific recommendations
    if (templateName.includes("security")) {
      recommendations.push(
        "[SECURITY] Security templates must pass all critical rules before deployment"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "[GENERAL] Review and address all security findings before deployment"
      );
    }

    return recommendations;
  }

  private static generateBatchRecommendations(analyses: any[]): string[] {
    const recommendations = [];
    const totalIssues = analyses.reduce(
      (sum, a) => sum + a.criticalIssues.length,
      0
    );
    const criticalTemplates = analyses.filter(
      (a) => a.severity === "critical"
    ).length;

    if (totalIssues === 0) {
      recommendations.push(
        "[SUCCESS] All templates pass critical security validation"
      );
      return recommendations;
    }

    if (criticalTemplates > 0) {
      recommendations.push(
        `[CRITICAL] Address ${criticalTemplates} critical templates before any deployment`
      );
    }

    recommendations.push(
      `[SUMMARY] ${totalIssues} total security issues identified across ${analyses.length} templates`
    );
    recommendations.push(
      "[PROCESS] Run security analysis regularly as part of CI/CD pipeline"
    );
    recommendations.push(
      "[DOCS] Review AWS security best practices documentation"
    );

    return recommendations;
  }
}

// ===== BACKWARD COMPATIBILITY =====
/**
 * Alias for existing code compatibility
 * @deprecated Use TemplateValidator instead
 */
export const CfnGuardTestHelper = TemplateValidator;

// ===== SIMPLE FUNCTION EXPORTS FOR CONVENIENCE =====
export const validateTemplate = TemplateValidator.validateTemplate;
export const quickValidate = TemplateValidator.quickValidate;
export const fullValidate = TemplateValidator.fullValidate;
export const validateBatch = TemplateValidator.validateBatch;
export const validateCritical = TemplateValidator.validateCritical;
export const validateAllCritical = TemplateValidator.validateAllCritical;
export const discoverTemplates = TemplateValidator.discoverTemplates;
export const getTemplatesByDomain = TemplateValidator.getTemplatesByDomain;
export const testRuleCategory = TemplateValidator.testRuleCategory;
export const testMultipleCategories = TemplateValidator.testMultipleCategories;
export const verifyRuleCategories = TemplateValidator.verifyRuleCategories;
export const validateSecurityFocused =
  TemplateValidator.validateSecurityFocused;
export const validateWithAllRules = TemplateValidator.validateWithAllRules;
export const validateProgressive = TemplateValidator.validateProgressive;
export const analyzeSecurityIssues = TemplateValidator.analyzeSecurityIssues;
export const analyzeBatchSecurity = TemplateValidator.analyzeBatchSecurity;
