import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import { CfnGuardTestHelper } from "../helpers/cfn-guard-helper";
import path from "path";

describe("Rules Validation with Helper", () => {
  const templatesPath = path.join(__dirname, "../fixtures/templates");

  it("Should test security-focused rules", async () => {
    const result = await CfnGuardTestHelper.validateTemplate(
      path.join(templatesPath, "vpc-template.yml"),
      ["baseline", "networking", "iam"]
    );

    console.log("Security Validation:", {
      success: result.success,
      errorCount: result.errors.length,
      duration: `${result.duration}ms`,
    });
  });

  it("Should test all available rules", async () => {
    const allRules = CfnGuardTestHelper.getAllRules();
    console.log(`Found ${allRules.length} rules files:`, allRules);

    const runner = new CfnGuardRunner();
    const result = await runner.validate(
      path.join(templatesPath, "vpc-template.yml"),
      allRules
    );

    console.log("Complete Validation:", {
      success: result.success,
      errorCount: result.errors.length,
      rulesCount: allRules.length,
    });
  });
});
