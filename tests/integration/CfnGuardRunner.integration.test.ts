import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import path from "path";
import fs from "fs";

describe("CfnGuardRunner Integration Tests", () => {
  let runner: CfnGuardRunner;
  const cfnGuardPath = path.join(__dirname, "../../cfn-guard");
  const templatesPath = path.join(__dirname, "../fixtures/templates");

  beforeEach(() => {
    runner = new CfnGuardRunner();
  });

  // Test with real cfn-guard rules
  it("Should validate a template against security baseline rules", async () => {
    const templatePath = path.join(templatesPath, "vpc-template.yaml");
    const rulesPath = [
      path.join(cfnGuardPath, "rules/baseline/security-baseline.guard"),
      path.join(cfnGuardPath, "rules/networking/networking-security.guard"),
    ];

    // This will run actual cfn-guard command
    const result = await runner.validate(templatePath, rulesPath);

    // Verify the result structure
    expect(result.tool).toBe("cfn-guard");
    expect(result.template).toBe(templatePath);
    expect(typeof result.duration).toBe("number");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.success).toBe("boolean");
  }, 10000);
});
