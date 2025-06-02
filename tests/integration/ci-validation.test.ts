import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import path from "path";
import fs from "fs";

describe("CI/CD Template Validation", () => {
  const runner = new CfnGuardRunner();
  const projectRoot = path.join(__dirname, "../../");

  // Critical rules that must pass for CI/CD
  const criticalRules = [
    "cfn-guard/rules/baseline/security-baseline.guard",
    "cfn-guard/rules/iam/iam-security.guard",
    "cfn-guard/rules/kms/encryption-security.guard",
  ]
    .map((rule) => path.join(projectRoot, rule))
    .filter((rule) => fs.existsSync(rule));

  // Procution template paths
  const productionTemplates = ["templates/pipelines/ci-cd-pipeline"];

  if (productionTemplates.length === 0) {
    console.warn(
      "⚠️ No production templates defined. Run 'yarn discover:templates' first."
    );
  }

  productionTemplates.forEach((templatePath) => {
    const templateName = path.basename(templatePath);
    it(`${templateName} should pass critical security validation`, async () => {
      const result = await runner.validate(
        path.join(projectRoot, templatePath),
        criticalRules
      );

      if (!result.success) {
        console.error(`❌ ${templateName} failed critical validation:`);
        result.errors.forEach((error) => console.error(`  - ${error}`));
      } else {
        console.log(`✅ ${templateName} passed critical validation`);
      }

      // Fail the test if critical rules fail (for CI/CD)
      expect(result.success).toBe(true);
    }, 30000);
  });
});
