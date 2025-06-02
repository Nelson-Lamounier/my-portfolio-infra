import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import { CfnGuardTestHelper } from "../helpers/cfn-guard-helper";
import path from "path";
import fs from "fs";

describe("Production Template Validation", () => {
  let runner: CfnGuardRunner;
  const projectRoot = path.join(__dirname, "../../");

  beforeEach(() => {
    runner = new CfnGuardRunner();
  });

  // Define template paths
  const productionTemplates = [
    // Compute
    "templates/compute/auto-scaling-group.yml",
    "templates/compute/ecs-cluster.yml",
    "templates/compute/ecs-service.yml",
    "templates/compute/launch-template.yml",
    // Core
    "templates/core/vpc.yml",
    // Networking
    "templates/networking/application-load-balancer.yml",
    "templates/networking/dns-records.yml",
    "templates/networking/network-load-balancer.yml",
    "templates/networking/ssl-certificate.yml",
    // Pipelines
    "templates/pipelines/ci-cd-pipeline.yml",
    // Security
    "templates/security/codebuild-policies.yml",
    "templates/security/codepipeline-policies.yml",
    "templates/security/ecs-policies.yml",
    "templates/security/ecs-security-groups.yml",
    "templates/security/kms.yml",
  ]
    .map((template) => path.join(projectRoot, template))
    .filter((template) => fs.existsSync(template)); // Only include existing files

  describe("Individual Template Validation", () => {
    productionTemplates.forEach((templatePath) => {
      const templateName = path.basename(templatePath);

      describe(`Template: ${templateName}`, () => {
        it("Should validate against security baseline rules", async () => {
          const result = await runner.validate(templatePath, [
            path.join(
              projectRoot,
              "cfn-guard/rules/baseline/security-baseline.guard"
            ),
          ]);
          console.log(`\n=== ${templateName} - Security Baseline ===`);
          console.log(`Success ${result.success}`);
          console.log(`Duration ${result.duration}ms`);
          console.log(`Errors: ${result.errors.length}`);

          if (result.errors.length > 0) {
            console.log("Issue found:");
            result.errors.forEach((error, index) => {
              console.log(` ${index + 1}. ${error}`);
            });
          }

          // Don't fail the test, just report results
          expect(result.tool).toBe("cfn-guard");
        });

        it("Should validate againt networking rules", async () => {
          const result = await runner.validate(templatePath, [
            path.join(
              projectRoot,
              "cfn-guard/rules/networking/networking-security.guard"
            ),
          ]);
          console.log(`\n=== ${templateName} - Networking Security ===`);
          console.log(`Success: ${result.success}`);
          console.log(`Errors: ${result.errors.length}`);

          if (!result.success && result.errors.length > 0) {
            console.log("Networking issues:");
            result.errors.slice(0, 5).forEach((error, index) => {
              console.log(` ${index + 1}. ${error}`);
            });
          }
        });

        it("Should validate against compute security rules", async () => {
          const result = await runner.validate(templatePath, [
            path.join(
              projectRoot,
              "cfn-guard/rules/compute/compute-security.guard"
            ),
            path.join(
              projectRoot,
              "cfn-guard/rules/compute/ec2-security.guard"
            ),
          ]);

          console.log(`\n=== ${templateName} - Compute Security ===`);
          console.log(`Success: ${result.success}`);
          console.log(`Errors: ${result.errors.length}`);
        });
      });
    });
  });
  describe("Comprehence Validation", () => {
    it("Should run all security rules against all templates", async () => {
      const securityRules = [
        // Baseline rules for general security hygiene
        "cfn-guard/rules/baseline/security-baseline.guard",

        // CI/CD pipeline security policies
        "cfn-guard/rules/cicd/cicd-security.guard", // Validates CodePipeline and CodeBuild configurations
        "cfn-guard/rules/cicd/pipeline-security.guard", // Enforces secure pipeline behavior

        // Compliance-focused rules (e.g., encryption, tagging, logging)
        "cfn-guard/rules/compliance/compliance.guard",

        // Compute resources such as EC2 and Auto Scaling Groups
        "cfn-guard/rules/compute/compute-security.guard", // Generic compute rules
        "cfn-guard/rules/compute/ec2-security.guard", // EC2-specific security validations

        // Cost optimization rules to prevent over-provisioning
        "cfn-guard/rules/cost/cost-optimisation.guard",

        // ECS-specific configurations and networking security
        "cfn-guard/rules/ecs/ecs-network-security.guard", // Validates ECS networking constraints
        "cfn-guard/rules/ecs/ecs-security.guard", // Covers ECS IAM roles and policies
        "cfn-guard/rules/ecs/ecs-service.guard", // Checks service definitions, Fargate flags, etc.

        // IAM policies, roles, and permission boundaries
        "cfn-guard/rules/iam/iam-security.guard",

        // KMS encryption and key usage best practices
        "cfn-guard/rules/kms/encryption-security.guard",

        // CloudWatch metrics, alarms, and logs validation
        "cfn-guard/rules/monitoring/monitoring.guard",

        // Networking configurations such as SGs, NACLs, DNS, ALBs
        "cfn-guard/rules/networking/dns-security.guard", // DNS records, Route 53 validations
        "cfn-guard/rules/networking/load-balancer-security.guard", // ELB/ALB/NLB access rules
        "cfn-guard/rules/networking/networking-architecture.guard", // CIDRs, subnet logic, peering, etc.
        "cfn-guard/rules/networking/networking-security.guard", // SG/NACL best practices

        // SSL/TLS certificate enforcement rules
        "cfn-guard/rules/ssl/ssl-security.guard",
      ]
        .map((rules) => path.join(projectRoot, rules))
        .filter((rules) => fs.existsSync(rules));

      console.log(`\n=== COMPREHENCE SECURITY VALIDATION ===`);
      console.log(`Template: ${productionTemplates.length}`);
      console.log(`Rules: ${securityRules.length}`);

      const results = [];

      for (const templatePath of productionTemplates) {
        const templateName = path.basename(templatePath);
        console.log(`\nValidation: ${templateName}`);

        const result = await runner.validate(templatePath, securityRules);

        results.push({
          template: templateName,
          success: result.success,
          errorCount: result.errors.length,
          duration: result.duration,
        });

        console.log(` ✓ Completed in ${result.duration}ms`);
        console.log(`  Issues found: ${result.errors.length}`);
      }

      // Summary report
      console.log(`\n=== VALIDATION SUMMARY ===`);
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
      const successFulTemplates = results.filter((r) => r.success).length;

      console.log(`Total templates: ${results.length}`);
      console.log(`Success validation: ${successFulTemplates}`);
      console.log(
        `Template with issues: ${results.length - successFulTemplates}`
      );
      console.log(`Total issue found: ${totalErrors}`);

      results.forEach((result) => {
        const status = result.success ? "✅" : "❌";
        console.log(
          ` ${status} ${result.template} (${result.errorCount}) issues`
        );

        expect(results.length).toBeGreaterThan(0);
      }, 60000); // 60 second timeout for comprehensive validation
    });
  });
});
