// tests/templates/rules-verification.test.ts
import { TemplateValidator } from "../../helpers/validator"; // ✅ Only import the class
import { Logger, LogLevel } from "../../../src/utils/Logger"; // ✅ Added Logger functionality
import path from "path";
import fs from "fs";

describe("CFN Guard Rules Verification", () => {
  const projectRoot = path.join(__dirname, "../../../"); // ✅ Fixed path

  // Use real templates instead of fixtures
  const testTemplate = path.join(projectRoot, "templates/core/vpc.yml");
  const computeTemplate = path.join(
    projectRoot,
    "templates/compute/ecs-cluster.yml"
  );

  beforeAll(() => {
    // Configure Logger
    Logger.configure({
      level: process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO,
      enableTimestamps: true,
      enableColors: true,
      prefix: "RULES-LOADING",
    });

    Logger.separator("CFN GUARD RULES VERIFICATION");

    try {
      // Use class method with projectRoot parameter
      const allTemplates = TemplateValidator.discoverTemplates(projectRoot);
      if (allTemplates.length === 0) {
        throw new Error("No CloudFormation templates found for rule testing");
      }

      Logger.info("Rules verification initialized", {
        totalTemplates: allTemplates.length,
        testTemplate: path.basename(testTemplate),
        computeTemplate: path.basename(computeTemplate),
      });
    } catch (error) {
      // ✅ Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error("Template discovery failed", errorMessage);
      throw new Error("Cannot test rules without templates");
    }
  });

  afterAll(() => {
    Logger.separator("RULES VERIFICATION TESTS COMPLETED");
    Logger.summary("Rules Verification Summary", {
      testSuite: "CFN Guard Rules Verification",
    });
  });

  describe("Rule Category Organization", () => {
    it("should have properly organized rule categories", () => {
      const testName = "Rule Category Organization";
      const startTime = Date.now();

      Logger.testStart(testName, "HEALTH");

      try {
        // ✅ Use class method instead of standalone function
        const categories = TemplateValidator.verifyRuleCategories();

        // Should have some basic categories
        const expectedCategories = [
          "baseline",
          "security",
          "networking",
          "compute",
          "iam",
        ];
        const foundCategories = Object.keys(categories);

        Logger.info("Rule Categories Health Check", {
          expectedCategories: expectedCategories.length,
          foundCategories: foundCategories.length,
          categories: foundCategories,
        });

        // Should have at least some core categories
        expect(foundCategories.length).toBeGreaterThan(0);

        // Should have rules in categories
        const totalRules = Object.values(categories).reduce(
          (sum, count) => sum + count,
          0
        );
        expect(totalRules).toBeGreaterThan(0);

        Logger.success(
          `Rule categories verified: ${foundCategories.length} categories, ${totalRules} total rules`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, true, duration, "HEALTH");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Rule category verification failed", errorMessage);
        Logger.testEnd(testName, false, duration, "HEALTH");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should have accessible rule files", () => {
      const testName = "Rule File Accessibility";
      const startTime = Date.now();

      Logger.testStart(testName, "HEALTH");

      try {
        //  Use class method instead of standalone function
        const categories = TemplateValidator.verifyRuleCategories();

        let totalFilesChecked = 0;
        let categoriesWithRules = 0;

        Object.entries(categories).forEach(([category, count]) => {
          if (count > 0) {
            categoriesWithRules++;
            const rules = TemplateValidator.getRulesByCategory(category);
            expect(rules.length).toBe(count);

            // Verify rule files actually exist
            rules.forEach((rulePath) => {
              expect(fs.existsSync(rulePath)).toBe(true);
              totalFilesChecked++;
            });

            Logger.info(`Category '${category}' verification`, {
              expectedRules: count,
              foundRules: rules.length,
              filesExist: rules.every((rulePath) => fs.existsSync(rulePath)),
            });
          }
        });

        Logger.success(
          `Rule files verified: ${totalFilesChecked} files in ${categoriesWithRules} categories`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, true, duration, "HEALTH");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Rule file accessibility check failed", errorMessage);
        Logger.testEnd(testName, false, duration, "HEALTH");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });

  describe("Individual Rule Category Testing", () => {
    it("should validate against baseline security rules", async () => {
      const testName = "Baseline Rules Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testRuleCategory(
          "baseline",
          testTemplate,
          {
            logResults: false, // Let our Logger handle the output
          }
        );

        Logger.info("Baseline rules test results", {
          rulesApplied: result.rulesApplied,
          success: result.success,
          template: path.basename(testTemplate),
        });

        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(typeof result.success).toBe("boolean");

        Logger.success(
          `Baseline validation completed: ${result.rulesApplied} rules applied`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, result.success, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Baseline rules validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should validate against networking security rules", async () => {
      const testName = "Networking Rules Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testRuleCategory(
          "networking",
          testTemplate,
          {
            logResults: false,
          }
        );

        Logger.info("Networking rules test results", {
          rulesApplied: result.rulesApplied,
          success: result.success,
          template: path.basename(testTemplate),
        });

        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(typeof result.success).toBe("boolean");

        Logger.success(
          `Networking validation completed: ${result.rulesApplied} rules applied`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, result.success, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Networking rules validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should validate against compute security rules", async () => {
      const templateToUse = fs.existsSync(computeTemplate)
        ? computeTemplate
        : testTemplate;
      const testName = "Compute Rules Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testRuleCategory(
          "compute",
          templateToUse,
          {
            logResults: false,
          }
        );

        Logger.info("Compute rules test results", {
          rulesApplied: result.rulesApplied,
          success: result.success,
          template: path.basename(templateToUse),
        });

        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(typeof result.success).toBe("boolean");

        Logger.success(
          `Compute validation completed: ${result.rulesApplied} rules applied`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, result.success, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Compute rules validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should validate against IAM security rules", async () => {
      const testName = "IAM Rules Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testRuleCategory(
          "iam",
          testTemplate,
          {
            logResults: false,
          }
        );

        Logger.info("IAM rules test results", {
          rulesApplied: result.rulesApplied,
          success: result.success,
          template: path.basename(testTemplate),
        });

        if (result.rulesApplied > 0) {
          expect(typeof result.success).toBe("boolean");
          Logger.success(
            `IAM validation completed: ${result.rulesApplied} rules applied`
          );
        } else {
          Logger.warn("No IAM rules found - skipping IAM validation");
        }

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, true, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("IAM rules validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should validate against KMS encryption rules", async () => {
      const testName = "KMS Rules Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        //  Use class method instead of standalone function
        const result = await TemplateValidator.testRuleCategory(
          "kms",
          testTemplate,
          {
            logResults: false,
          }
        );

        Logger.info("KMS rules test results", {
          rulesApplied: result.rulesApplied,
          success: result.success,
          template: path.basename(testTemplate),
        });

        if (result.rulesApplied > 0) {
          expect(typeof result.success).toBe("boolean");
          Logger.success(
            `KMS validation completed: ${result.rulesApplied} rules applied`
          );
        } else {
          Logger.warn("No KMS rules found - skipping KMS validation");
        }

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, true, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("KMS rules validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });

  describe("Multiple Rule Categories", () => {
    it("should validate against multiple rule categories", async () => {
      const categories = ["baseline", "networking", "iam"];
      const testName = "Multi-Category Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testMultipleCategories(
          categories,
          testTemplate
        );

        Logger.info("Multi-category validation results", {
          requestedCategories: categories.length,
          usedCategories: result.categoriesUsed.length,
          rulesApplied: result.rulesApplied,
          success: result.success,
          issues: result.guardErrors.length,
          duration: result.duration,
        });

        expect(result.categoriesUsed.length).toBeGreaterThan(0);
        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(typeof result.success).toBe("boolean");
        expect(Array.isArray(result.guardErrors)).toBe(true);
        expect(typeof result.duration).toBe("number");

        Logger.success(
          `Multi-category validation completed: ${result.rulesApplied} rules from ${result.categoriesUsed.length} categories`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, result.success, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Multi-category validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should handle comprehensive rule category testing", async () => {
      const testName = "Comprehensive Category Testing";
      const startTime = Date.now();

      Logger.testStart(testName, "VALIDATION");

      try {
        // Use class method instead of standalone function
        const allCategories = Object.keys(
          TemplateValidator.verifyRuleCategories()
        );

        if (allCategories.length === 0) {
          Logger.warn("No rule categories found - skipping comprehensive test");
          return;
        }

        // Use class method instead of standalone function
        const result = await TemplateValidator.testMultipleCategories(
          allCategories,
          testTemplate
        );

        Logger.info("Comprehensive category testing results", {
          availableCategories: allCategories.length,
          successfullyUsed: result.categoriesUsed.length,
          totalRules: result.rulesApplied,
          validationDuration: result.duration,
          success: result.success,
        });

        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(result.categoriesUsed.length).toBeGreaterThan(0);

        Logger.success(
          `Comprehensive testing completed: ${result.rulesApplied} rules from ${result.categoriesUsed.length}/${allCategories.length} categories`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, result.success, duration, "VALIDATION");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Comprehensive category testing failed", errorMessage);
        Logger.testEnd(testName, false, duration, "VALIDATION");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });

  describe("Rule Category Performance", () => {
    it("should complete rule category testing within reasonable time", async () => {
      const categories = ["baseline", "security"];
      const testName = "Rule Category Performance";
      const startTime = Date.now();

      Logger.testStart(testName, "PERFORMANCE");

      try {
        // Use class method instead of standalone function
        const result = await TemplateValidator.testMultipleCategories(
          categories,
          testTemplate
        );
        const totalDuration = Date.now() - startTime;

        const performanceMetrics = {
          totalTestDuration: totalDuration,
          cfnGuardDuration: result.duration,
          rulesProcessed: result.rulesApplied,
          averageTimePerRule:
            result.rulesApplied > 0
              ? (result.duration / result.rulesApplied).toFixed(2)
              : 0,
          categories: result.categoriesUsed,
        };

        Logger.info("Performance metrics", performanceMetrics);

        expect(totalDuration).toBeLessThan(30000); // 30 seconds

        const isPerformant = totalDuration < 30000;
        Logger.success(
          `Performance test completed: ${totalDuration}ms total, ${result.duration}ms validation`
        );

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, isPerformant, duration, "PERFORMANCE");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Performance testing failed", errorMessage);
        Logger.testEnd(testName, false, duration, "PERFORMANCE");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });
});
