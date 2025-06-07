// tests/templates/domain/networking.test.ts
import { TemplateValidator } from "../../helpers/validator"; // ✅ Class-only import
import { Logger, LogLevel } from "../../../src/utils/Logger"; // ✅ Added Logger
import path from "path";
import fs from "fs";

describe("Networking Domain Templates", () => {
  const projectRoot = path.join(__dirname, "../../../"); // ✅ Fixed path

  // Extract networking templates from your original list
  const networkingTemplates = [
    "templates/networking/application-load-balancer.yml",
    "templates/networking/dns-records.yml",
    "templates/networking/network-load-balancer.yml",
    "templates/networking/ssl-certificate.yml",
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
      prefix: "NETWORKING-DOMAIN",
    });

    Logger.separator("NETWORKING DOMAIN TEMPLATE VALIDATION");

    Logger.info("Networking domain validation initialized", {
      projectRoot: projectRoot,
      totalTemplates: networkingTemplates.length,
      templates: networkingTemplates.map((t) => path.basename(t)),
    });

    if (networkingTemplates.length === 0) {
      Logger.warn("No networking templates found for testing");
    }
  });

  afterAll(() => {
    Logger.separator("NETWORKING DOMAIN TESTS COMPLETED");
    Logger.summary("Networking Domain Summary", {
      templatesValidated: networkingTemplates.length,
      testSuite: "Networking Domain Validation",
    });
  });

  describe("Individual Template Validation", () => {
    networkingTemplates.forEach((templatePath) => {
      const templateName = path.basename(templatePath);
      const fullPath = path.join(projectRoot, templatePath);

      describe(`Template: ${templateName}`, () => {
        it("should validate against security baseline rules", async () => {
          const testName = `${templateName} - Security Baseline`;
          const startTime = Date.now();

          Logger.testStart(testName, "BASELINE");

          try {
            // ✅ Use class method with correct path
            const result = await TemplateValidator.validateTemplate(
              fullPath,
              ["baseline"],
              { logLevel: "minimal" }
            );

            Logger.template(templateName, "Baseline validation results", {
              success: result.success,
              errors: result.guardErrors.length,
              duration: result.duration,
              rulesApplied: result.rulesApplied,
            });

            // Networking templates should be clean
            expect(result.success || result.guardErrors.length < 10).toBe(true);

            const duration = Date.now() - startTime;
            Logger.testEnd(
              testName,
              result.success || result.guardErrors.length < 10,
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

        // ===== PRESERVE YOUR NETWORKING VALIDATION LOGIC =====
        it("should validate against networking rules", async () => {
          const testName = `${templateName} - Networking Security`;
          const startTime = Date.now();

          Logger.testStart(testName, "NETWORKING");

          try {
            // ✅ Use class method with networking-specific rules
            const result = await TemplateValidator.validateTemplate(
              fullPath,
              ["networking", "dns", "load-balancer"], // Networking-specific rules
              { logLevel: "detailed" }
            );

            Logger.template(
              templateName,
              "Networking security validation results",
              {
                success: result.success,
                errors: result.guardErrors.length,
                duration: result.duration,
                rulesApplied: result.rulesApplied,
                categories: ["networking", "dns", "load-balancer"],
              }
            );

            if (!result.success && result.guardErrors.length > 0) {
              Logger.warn(`Networking issues found in ${templateName}`, {
                totalIssues: result.guardErrors.length,
                sampleIssues: result.guardErrors.slice(0, 3),
              });
            }

            // Networking should be very secure
            expect(result.guardErrors.length).toBeLessThan(8);

            const duration = Date.now() - startTime;
            Logger.testEnd(
              testName,
              result.guardErrors.length < 8,
              duration,
              "NETWORKING"
            );
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            Logger.error(
              `Networking security validation failed for ${templateName}`,
              errorMessage
            );
            Logger.testEnd(testName, false, duration, "NETWORKING");
            throw error instanceof Error ? error : new Error(String(error));
          }
        });

        // SSL-specific validation for certificate templates
        if (
          templateName.includes("ssl") ||
          templateName.includes("certificate")
        ) {
          it("should validate against SSL/TLS security rules", async () => {
            const testName = `${templateName} - SSL Security`;
            const startTime = Date.now();

            Logger.testStart(testName, "SSL");

            try {
              // ✅ Use class method for SSL validation
              const result = await TemplateValidator.validateTemplate(
                fullPath,
                ["ssl", "tls"],
                { logLevel: "detailed" }
              );

              Logger.template(
                templateName,
                "SSL/TLS security validation results",
                {
                  success: result.success,
                  errors: result.guardErrors.length,
                  duration: result.duration,
                  rulesApplied: result.rulesApplied,
                  securityType: "SSL/TLS",
                }
              );

              // SSL should be very strict
              expect(result.guardErrors.length).toBeLessThan(3);

              const duration = Date.now() - startTime;
              Logger.testEnd(
                testName,
                result.guardErrors.length < 3,
                duration,
                "SSL"
              );
            } catch (error) {
              const duration = Date.now() - startTime;
              const errorMessage =
                error instanceof Error ? error.message : String(error);

              Logger.error(
                `SSL security validation failed for ${templateName}`,
                errorMessage
              );
              Logger.testEnd(testName, false, duration, "SSL");
              throw error instanceof Error ? error : new Error(String(error));
            }
          });
        }

        // Load Balancer-specific validation
        if (
          templateName.includes("load-balancer") ||
          templateName.includes("alb") ||
          templateName.includes("nlb")
        ) {
          it("should validate against load balancer security rules", async () => {
            const testName = `${templateName} - Load Balancer Security`;
            const startTime = Date.now();

            Logger.testStart(testName, "LOAD-BALANCER");

            try {
              // ✅ Use class method for load balancer validation
              const result = await TemplateValidator.validateTemplate(
                fullPath,
                ["load-balancer", "alb", "nlb"],
                { logLevel: "detailed" }
              );

              Logger.template(
                templateName,
                "Load balancer security validation results",
                {
                  success: result.success,
                  errors: result.guardErrors.length,
                  duration: result.duration,
                  rulesApplied: result.rulesApplied,
                  serviceType: "Load Balancer",
                }
              );

              // Load balancers should be secure
              expect(result.guardErrors.length).toBeLessThan(5);

              const duration = Date.now() - startTime;
              Logger.testEnd(
                testName,
                result.guardErrors.length < 5,
                duration,
                "LOAD-BALANCER"
              );
            } catch (error) {
              const duration = Date.now() - startTime;
              const errorMessage =
                error instanceof Error ? error.message : String(error);

              Logger.error(
                `Load balancer security validation failed for ${templateName}`,
                errorMessage
              );
              Logger.testEnd(testName, false, duration, "LOAD-BALANCER");
              throw error instanceof Error ? error : new Error(String(error));
            }
          });
        }
      });
    });
  });

  // ===== BATCH VALIDATION FOR NETWORKING DOMAIN =====
  describe("Networking Domain Validation", () => {
    it("should validate all networking templates together", async () => {
      const testName = "Networking Domain Batch Validation";
      const startTime = Date.now();

      Logger.testStart(testName, "DOMAIN");

      if (networkingTemplates.length === 0) {
        Logger.warn("No networking templates available for batch validation");
        expect(true).toBe(true);
        return;
      }

      try {
        Logger.info("Starting networking domain batch validation", {
          totalTemplates: networkingTemplates.length,
          ruleCategories: [
            "baseline",
            "networking",
            "dns",
            "load-balancer",
            "ssl",
          ],
        });

        // ✅ Use class method for batch validation
        const fullPaths = networkingTemplates.map((template) =>
          path.join(projectRoot, template)
        );
        const results = await TemplateValidator.validateBatch(fullPaths, [
          "baseline",
          "networking",
          "dns",
          "load-balancer",
          "ssl",
        ]);

        const successful = results.filter((r) => r.success).length;
        const totalErrors = results.reduce(
          (sum, r) => sum + r.guardErrors.length,
          0
        );
        const avgErrors =
          networkingTemplates.length > 0
            ? totalErrors / networkingTemplates.length
            : 0;

        Logger.info("Networking domain batch validation results", {
          templatesProcessed: results.length,
          successful: successful,
          totalErrors: totalErrors,
          averageErrorsPerTemplate: Math.round(avgErrors * 100) / 100,
          successRate: `${Math.round((successful / results.length) * 100)}%`,
        });

        // Networking should be very clean (stricter than compute)
        expect(totalErrors).toBeLessThan(networkingTemplates.length * 8);
        expect(avgErrors).toBeLessThan(5); // Average should be low

        const duration = Date.now() - startTime;
        Logger.testEnd(
          testName,
          totalErrors < networkingTemplates.length * 8,
          duration,
          "DOMAIN"
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error("Networking domain batch validation failed", errorMessage);
        Logger.testEnd(testName, false, duration, "DOMAIN");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });

    it("should validate networking domain security compliance", async () => {
      const testName = "Networking Security Compliance";
      const startTime = Date.now();

      Logger.testStart(testName, "SECURITY");

      if (networkingTemplates.length === 0) {
        Logger.warn(
          "No networking templates available for security compliance testing"
        );
        expect(true).toBe(true);
        return;
      }

      try {
        // ✅ Use class method for security-focused validation
        const securityResults = await Promise.all(
          networkingTemplates.map(async (template) => {
            const fullPath = path.join(projectRoot, template);
            return await TemplateValidator.validateSecurityFocused(fullPath, {
              logResults: false,
            });
          })
        );

        const securityIssues = securityResults.reduce(
          (sum, result) => sum + result.guardErrors.length,
          0
        );
        const avgSecurityIssues =
          securityResults.length > 0
            ? securityIssues / securityResults.length
            : 0;
        const highSeverityIssues = securityResults.filter(
          (r) => r.guardErrors.length > 5
        ).length;

        Logger.info("Networking security compliance results", {
          templatesChecked: securityResults.length,
          totalSecurityIssues: securityIssues,
          averageSecurityIssues: Math.round(avgSecurityIssues * 100) / 100,
          highSeverityTemplates: highSeverityIssues,
          complianceRate: `${Math.round(
            ((securityResults.length - highSeverityIssues) /
              securityResults.length) *
              100
          )}%`,
        });

        // Networking should have excellent security compliance
        expect(avgSecurityIssues).toBeLessThan(3);
        expect(highSeverityIssues).toBeLessThan(
          Math.ceil(securityResults.length * 0.2)
        ); // Less than 20% high severity

        const duration = Date.now() - startTime;
        Logger.testEnd(testName, avgSecurityIssues < 3, duration, "SECURITY");
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        Logger.error(
          "Networking security compliance testing failed",
          errorMessage
        );
        Logger.testEnd(testName, false, duration, "SECURITY");
        throw error instanceof Error ? error : new Error(String(error));
      }
    });
  });
});
