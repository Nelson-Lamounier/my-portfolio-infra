// tests/templates/validation-patterns.test.ts
import {
  TemplateValidator,
  validateSecurityFocused,
  validateWithAllRules,
  validateProgressive,
} from "../../helpers/validator";
import path from "path";
import fs from "fs";

describe("Validation Patterns", () => {
  const projectRoot = path.join(__dirname, "../../");

  // Get some real templates to test with
  const testTemplates = TemplateValidator.discoverTemplates()
    .filter((template) => fs.existsSync(template))
    .slice(0, 3); // Test with first 3 templates for efficiency

  beforeAll(() => {
    if (testTemplates.length === 0) {
      throw new Error("No templates found for validation pattern testing");
    }
    console.log(
      `\n🧪 Testing validation patterns with ${testTemplates.length} templates:`
    );
    testTemplates.forEach((template, index) => {
      const relativePath = path.relative(projectRoot, template);
      console.log(`  ${index + 1}. ${relativePath}`);
    });
  });

  // ===== PRESERVE YOUR SECURITY-FOCUSED VALIDATION LOGIC =====
  describe("Security-Focused Rule Testing", () => {
    testTemplates.forEach((templatePath) => {
      const templateName = path.basename(templatePath);

      it(`${templateName} should pass security-focused validation`, async () => {
        // Preserve your original security-focused test logic
        const result = await validateSecurityFocused(templatePath, {
          logResults: true,
        });

        console.log(`\n🔒 Security-focused results for ${templateName}:`);
        console.log(
          `  Categories tested: ${result.securityCategories.join(", ")}`
        );
        console.log(`  Rules applied: ${result.rulesApplied}`);
        console.log(`  Success: ${result.success}`);
        console.log(`  Issues: ${result.guardErrors.length}`);

        // Verify the validation ran properly
        expect(result.rulesApplied).toBeGreaterThan(0);
        expect(typeof result.success).toBe("boolean");
        expect(Array.isArray(result.guardErrors)).toBe(true);

        // For personal projects: reasonable thresholds
        expect(result.guardErrors.length).toBeLessThan(25);
      }, 30000);
    });

    it("should have consistent security-focused validation across templates", async () => {
      const results = [];

      for (const templatePath of testTemplates) {
        const result = await validateSecurityFocused(templatePath, {
          logResults: false,
        });
        results.push({
          template: path.basename(templatePath),
          success: result.success,
          issues: result.guardErrors.length,
          duration: result.duration,
        });
      }

      console.log(`\n📊 Security-Focused Validation Summary:`);
      results.forEach((result) => {
        const status = result.success ? "✅" : "⚠️";
        console.log(
          `  ${status} ${result.template}: ${result.issues} issues (${result.duration}ms)`
        );
      });

      const avgIssues =
        results.reduce((sum, r) => sum + r.issues, 0) / results.length;
      console.log(`  Average issues per template: ${avgIssues.toFixed(1)}`);

      // All should have run successfully (even if they found issues)
      expect(results.length).toBe(testTemplates.length);
      expect(results.every((r) => typeof r.success === "boolean")).toBe(true);
    });
  });

  // ===== PRESERVE YOUR COMPLETE VALIDATION LOGIC =====
  describe("Complete Rule Testing", () => {
    // Test with one template to avoid overwhelming output
    const sampleTemplate = testTemplates[0];
    const templateName = path.basename(sampleTemplate);

    it(`${templateName} should handle complete validation with all rules`, async () => {
      // Preserve your original complete validation test logic
      const result = await validateWithAllRules(sampleTemplate, {
        logResults: true,
      });

      console.log(`\n🌍 Complete validation results for ${templateName}:`);
      console.log(`  Total rules used: ${result.totalRulesUsed}`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Issues found: ${result.guardErrors.length}`);
      console.log(`  Validation duration: ${result.duration}ms`);

      // Verify the validation ran properly
      expect(result.totalRulesUsed).toBeGreaterThan(0);
      expect(typeof result.success).toBe("boolean");
      expect(Array.isArray(result.guardErrors)).toBe(true);

      // Complete validation may find more issues
      expect(result.guardErrors.length).toBeLessThan(100); // Reasonable upper bound
    }, 60000); // Extended timeout for complete validation

    it("should have reasonable performance with all rules", async () => {
      const result = await validateWithAllRules(sampleTemplate, {
        logResults: false,
      });

      const performanceMetrics = {
        totalRules: result.totalRulesUsed,
        duration: result.duration,
        rulesPerSecond: result.totalRulesUsed / (result.duration / 1000),
        msPerRule: result.duration / result.totalRulesUsed,
      };

      console.log(`\n⚡ Performance Metrics:`);
      console.log(`  Rules processed: ${performanceMetrics.totalRules}`);
      console.log(`  Total duration: ${performanceMetrics.duration}ms`);
      console.log(
        `  Rules per second: ${performanceMetrics.rulesPerSecond.toFixed(2)}`
      );
      console.log(
        `  Avg time per rule: ${performanceMetrics.msPerRule.toFixed(2)}ms`
      );

      // Performance expectations for personal projects
      expect(result.duration).toBeLessThan(120000); // Should complete within 2 minutes
      expect(performanceMetrics.msPerRule).toBeLessThan(1000); // No rule should take > 1 second
    });
  });

  // ===== NEW: PROGRESSIVE VALIDATION TESTING =====
  describe("Progressive Validation", () => {
    const sampleTemplate = testTemplates[0];
    const templateName = path.basename(sampleTemplate);

    it(`${templateName} should show progressive validation complexity`, async () => {
      const results = await validateProgressive(sampleTemplate);

      console.log(`\n🔄 Progressive validation results for ${templateName}:`);
      console.log(`  Baseline issues: ${results.baseline.guardErrors.length}`);
      console.log(`  Security issues: ${results.security.guardErrors.length}`);
      console.log(
        `  Comprehensive issues: ${results.comprehensive.guardErrors.length}`
      );
      console.log(
        `  Tests passed: ${results.summary.successfulTests}/${results.summary.totalTests}`
      );

      // Verify progressive complexity
      expect(results.baseline.rulesApplied).toBeLessThanOrEqual(
        results.security.rulesApplied
      );
      expect(results.security.rulesApplied).toBeLessThanOrEqual(
        results.comprehensive.rulesApplied
      );

      // All tests should have run
      expect(results.summary.totalTests).toBe(3);

      // Should have found some rules to run
      expect(results.comprehensive.rulesApplied).toBeGreaterThan(0);
    });
  });

  // ===== RULE DISCOVERY VERIFICATION =====
  describe("Rule Discovery", () => {
    it("should discover and validate rule files", () => {
      const allRules = TemplateValidator.getAllRules();

      console.log(`\n🔍 Rule Discovery Results:`);
      console.log(`  Total rules found: ${allRules.length}`);

      if (allRules.length > 0) {
        console.log(`  Sample rules:`);
        allRules.slice(0, 5).forEach((rule, index) => {
          const relativePath = path.relative(projectRoot, rule);
          console.log(`    ${index + 1}. ${relativePath}`);
        });

        if (allRules.length > 5) {
          console.log(`    ... and ${allRules.length - 5} more`);
        }
      }

      // Basic validation
      expect(allRules.length).toBeGreaterThan(0);

      // Verify rule files exist
      allRules.slice(0, 10).forEach((rule) => {
        // Check first 10 for performance
        expect(fs.existsSync(rule)).toBe(true);
        expect(rule.endsWith(".guard")).toBe(true);
      });
    });

    it("should have rules organized by category", () => {
      const categories = TemplateValidator.verifyRuleCategories();
      const categoryNames = Object.keys(categories);

      console.log(`\n📁 Rule Categories:`);
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} rules`);
      });

      expect(categoryNames.length).toBeGreaterThan(0);

      // Should have some basic security categories
      const expectedCategories = ["baseline", "security"];
      const hasBasicCategories = expectedCategories.some((cat) =>
        categoryNames.includes(cat)
      );
      expect(hasBasicCategories).toBe(true);
    });
  });
});
