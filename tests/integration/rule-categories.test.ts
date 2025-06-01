import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import path from "path";

describe("CFN Guard Rules Categories", () => {
  let runner: CfnGuardRunner;
  const cfnGuardPath = path.join(__dirname, "../../cfn-guard");
  const templatesPath = path.join(__dirname, "../fixtures/templates");

  beforeEach(() => {
    runner = new CfnGuardRunner();
  });

  describe("Security Rules", () => {
    it("Should validate against baseline security rules", async () => {
      const result = await runner.validate(
        path.join(templatesPath, "vpc-template.yml"),
        [path.join(cfnGuardPath, "rulesbaseline/security-baseline.guard")]
      );

      expect(result.tool).toBe("cfn-guard");
      console.log("Baseline Security Results:", {
        success: result.success,
        errors: result.errors,
        duration: result.duration,
      });
    });

    it("Should validate against networking security rules", async () => {
      const result = await runner.validate(
        path.join(templatesPath, "vpc-template.yml"),
        [path.join(cfnGuardPath, "rules/networking/networking-security.guard")]
      );

      console.log("Networking Security Result:", {
        success: result.success,
        errors: result.errors,
      });
    });

    it("Should validate against computer security rules", async () => {
      const result = await runner.validate(
        path.join(templatesPath, "ec2-template.yml"),
        [path.join(cfnGuardPath, "rules/compute/compute-security.guard")]
      );

      console.log("Compute Security Results:", {
        success: result.success,
        errors: result.errors,
      });
    });
  });

  describe("Multiple Rule Category", () => {
    it("Should validate against multiple rule categories", async () => {
      const rules = [
        path.join(cfnGuardPath, "rules/baseline/security-baseline.guard"),
        path.join(cfnGuardPath, "rules/networking/networking-security.guard"),
        path.join(cfnGuardPath, "rules/iam/iam-security.guard"),
      ];

      const result = await runner.validate(
        path.join(templatesPath, "vpc-template.yml"),
        rules
      );

      console.log("Multi-Category Results:", {
        success: result.success,
        errorsCount: result.errors.length,
        duration: result.duration,
      });

      // Verify all rules files were used
      expect(result.rules).toEqual(rules);
    });
  });
});
