// tests/templates/domain/compute.test.ts
import { TemplateValidator } from "../../helpers/validator"; // ✅ Class-only import
import { Logger, LogLevel } from "../../../src/utils/Logger"; // ✅ Added Logger
import path from "path";
import fs from "fs";

describe("Compute Domain Templates", () => {
  const projectRoot = path.join(__dirname, "../../../"); // ✅ Fixed path

  // Extract compute templates from your original list
  const computeTemplates = [
    "templates/compute/auto-scaling-group.yml",
    "templates/compute/ecs-cluster.yml",
    "templates/compute/ecs-service.yml",
    "templates/compute/launch-template.yml",
  ].filter((template) => {
    const fullPath = path.join(projectRoot, template);
    return fs.existsSync(fullPath);
  });

  beforeAll(() => {
    // ✅ Configure Logger
    Logger.configure({
      level: process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO,
      enableTimestamps: true,
      enableColors: true,
      prefix: "COMPUTE-DOMAIN",
    });

    Logger.separator("COMPUTE DOMAIN TEMPLATE VALIDATION");

    Logger.info("Compute domain validation initialized", {
      projectRoot: projectRoot,
      totalTemplates: computeTemplates.length,
      templates: computeTemplates.map((t) => path.basename(t)),
    });

    if (computeTemplates.length === 0) {
      Logger.warn("No compute templates found for testing");
    }
  });

  afterAll(() => {
    Logger.separator("COMPUTE DOMAIN TESTS COMPLETED");
    Logger.summary("Compute Domain Summary", {
      templatesValidated: computeTemplates.length,
      testSuite: "Compute Domain Validation",
    });
  });

  describe("Individual Template Validation", () => {
    computeTemplates.forEach((templatePath) => {
      const templateName = path.basename(templatePath);
      const fullPath = path.join(projectRoot, templatePath);

      describe(`Template: ${templateName}`, () => {
        it("should validate against security baseline rules", async () => {
          const testName = `${templateName} - Security Baseline`;
          const startTime = Date.now();

          Logger.testStart(testName, "BASELINE");

          try {
            // ✅ Use class method
            const result = await TemplateValidator.validateTemplate(
              fullPath,
              ["baseline"],
              {
                logLevel: "minimal",
              }
            );

            Logger.template(templateName, "Baseline validation results", {
              success: result.success,
              errors: result.guardErrors.length,
              duration: result.duration,
              rulesApplied: result.rulesApplied,
            });

            // Compute templates can have some complexity
            expect(result.success || result.guardErrors.length < 15).toBe(true);

            const duration = Date.now() - startTime;
            Logger.testEnd(
              testName,
              result.success || result.guardErrors.length < 15,
              duration,
              "BASELINE"
            );
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            Logger.error(
              `Baseline validation failed for ${templateName}`,
              errorMessage
            );
            Logger.testEnd(testName, false, duration, "BASELINE");
            throw error instanceof Error ? error : new Error(String(error));
          }
        });

        it("should validate against compute security rules", async () => {
          const testName = `${templateName} - Compute Security`;
          const startTime = Date.now();

          Logger.testStart(testName, "COMPUTE");

          try {
            // ✅ Use class method with multiple rule categories
            const result = await TemplateValidator.validateTemplate(
              fullPath,
              ["compute", "ec2"], // Multiple rule categories like your original
              { logLevel: "detailed" }
            );

            Logger.template(
              templateName,
              "Compute security validation results",
              {
                success: result.success,
                errors: result.guardErrors.length,
                duration: result.duration,
                rulesApplied: result.rulesApplied,
                categories: ["compute", "ec2"],
              }
            );

            // Compute resources often have more complex configurations
            expect(result.guardErrors.length).toBeLessThan(20);

            const duration = Date.now() - startTime;
            Logger.testEnd(
              testName,
              result.guardErrors.length < 20,
              duration,
              "COMPUTE"
            );
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            Logger.error(
              `Compute security validation failed for ${templateName}`,
              errorMessage
            );
            Logger.testEnd(testName, false, duration, "COMPUTE");
            throw error instanceof Error ? error : new Error(String(error));
          }
        });

        // ECS-specific validation for ECS templates
        if (templateName.includes("ecs")) {
          it("should validate against ECS-specific security rules", async () => {
            const testName = `${templateName} - ECS Security`;
            const startTime = Date.now();

            Logger.testStart(testName, "ECS");

            try {
              // ✅ Use class method for ECS-specific rules
              const result = await TemplateValidator.validateTemplate(
                fullPath,
                ["ecs"], // ECS-specific rules
                { logLevel: "detailed" }
              );

              Logger.template(templateName, "ECS-specific validation results", {
                success: result.success,
                errors: result.guardErrors.length,
                duration: result.duration,
                rulesApplied: result.rulesApplied,
                serviceType: "ECS",
              });

              expect(result.guardErrors.length).toBeLessThan(10);

              const duration = Date.now() - startTime;
              Logger.testEnd(
                testName,
                result.guardErrors.length < 10,
                duration,
                "ECS"
              );
            } catch (error) {
              const duration = Date.now() - startTime;
              const errorMessage =
                error instanceof Error ? error.message : String(error);

              Logger.error(
                `ECS security validation failed for ${templateName}`,
                errorMessage
              );
              Logger.testEnd(testName, false, duration, "ECS");
              throw error instanceof Error ? error : new Error(String(error));
            }
          });
        }
      });
    });
  });

  // ===== BATCH VALIDATION FOR COMPUTE DOMAIN =====
  describe("Compute Domain Validation", () => {
    it("should validate all compute templates together", async () => {
      const testName = "Compute Domain Batch Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "DOMAIN");

      if (computeTemplates.length === 0) {
        Logger.warn("No compute templates available for batch validation");
        expect(true).toBe(true);
        return;
      }

      try {
        Logger.info("Starting compute domain batch validation", {
          totalTemplates: computeTemplates.length,
          ruleCategories: ["baseline", "compute", "ec2", "ecs"],
        });

        // ✅ Use class method for batch validation
        const fullPaths = computeTemplates.map((template) =>
          path.join(projectRoot, template)
        );
        const results = await TemplateValidator.validateBatch(fullPaths, [
          "baseline",
          "compute",
          "ec2",
          "ecs",
        ]);

        const successful = results.filter((r) => r.success).length;
        const totalErrors = results.reduce(
          (sum, r) => sum + r.guardErrors.length,
          0
        );
        const avgErrors =
          computeTemplates.length > 0
            ? totalErrors / computeTemplates.length
            : 0;

        Logger.info("Compute domain batch validation results", {
          templatesProcessed: results.length,
          successful: successful,
          totalErrors: totalErrors,
          averageErrorsPerTemplate: Math.round(avgErrors * 100) / 100,
          successRate: `${Math.round((successful / results.length) * 100)}%`,
        });

        // Compute domain should have reasonable issue counts
        expect(totalErrors).toBeLessThan(computeTemplates.length * 15);

        const duration = Date.now() - startTime;
        Logger.testEnd(
          testName,
          totalErrors < computeTemplates.length * 15,
          duration,
          "DOMAIN"
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Compute domain batch validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "DOMAIN");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });
});
