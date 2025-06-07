// tests/helpers/cfn-guard-runner.test.ts (moved from tests/unit/)
import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import { Logger } from "../../src/utils/Logger";
import { spawn } from "child_process";
import { EventEmitter } from "events";

// Mock both child_process and Logger
jest.mock("child_process");
jest.mock("../../src/utils/Logger");

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedLogger = Logger as jest.Mocked<typeof Logger>;

/**
 * Helper to create mock child process for testing
 */
function createMockChildProcess() {
  const mockedChildProcess = new EventEmitter() as any;
  mockedChildProcess.stdout = new EventEmitter();
  mockedChildProcess.stderr = new EventEmitter();
  return mockedChildProcess;
}

/**
 * Test data types for parameterized tests
 */
interface OutputParsingTestCase {
  name: string;
  stdout: string;
  stderr: string;
  expectedErrors: string[];
  expectedSuccess: boolean;
}

interface RuleStructureTestCase {
  name: string;
  templatePath: string;
  rules: string[];
  expectedSuccess: boolean;
  mockOutput: string;
  description: string;
}

interface EdgeCaseTestCase {
  name: string;
  templatePath: string;
  rules: string[];
  expectedBehavior: "success" | "error";
  mockOutput: string;
  description: string;
}

interface ProcessErrorTestCase {
  name: string;
  errorType: string;
  errorMessage: string;
  expectedErrorPattern: string;
}

describe("CfnGuardRunner", () => {
  let runner: CfnGuardRunner;

  beforeEach(() => {
    runner = new CfnGuardRunner();
    jest.clearAllMocks();
  });

  // ===== PARAMETERIZED OUTPUT PARSING TESTS =====
  describe("Output Parsing (Parameterized)", () => {
    const outputParsingCases: OutputParsingTestCase[] = [
      {
        name: "successful validation with info messages",
        stdout: `[INFO] Starting validation
                [INFO] All rules passed
                [INFO] Validation complete`,
        stderr: "",
        expectedErrors: [],
        expectedSuccess: true,
      },
      {
        name: "single ERROR pattern",
        stdout: "[ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed",
        stderr: "",
        expectedErrors: [
          "[ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed",
        ],
        expectedSuccess: false,
      },
      {
        name: "single FAIL pattern",
        stdout: "[FAIL] S3 bucket allows public read access",
        stderr: "",
        expectedErrors: ["[FAIL] S3 bucket allows public read access"],
        expectedSuccess: false,
      },
      {
        name: "single VIOLATION pattern",
        stdout: "[VIOLATION] Security group allows unrestricted access",
        stderr: "",
        expectedErrors: [
          "[VIOLATION] Security group allows unrestricted access",
        ],
        expectedSuccess: false,
      },
      {
        name: "multiple error patterns mixed",
        stdout: `
          [INFO] Starting validation
          [ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed
          [FAIL] S3 bucket allows public read access
          [VIOLATION] Security group allows unrestricted access
          [INFO] Continuing validation
          [ERROR] ECS task definition lacks security configuration
        `,
        stderr: "",
        expectedErrors: [
          "[ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed",
          "[FAIL] S3 bucket allows public read access",
          "[VIOLATION] Security group allows unrestricted access",
          "[ERROR] ECS task definition lacks security configuration",
        ],
        expectedSuccess: false,
      },
      {
        name: "stderr only with no stdout errors",
        stdout: "[INFO] Starting validation",
        stderr: "Template file not found",
        expectedErrors: ["Template file not found"],
        expectedSuccess: false,
      },
      {
        name: "both stdout and stderr errors",
        stdout: "[ERROR] Validation rule failed",
        stderr: "Command execution error",
        expectedErrors: [
          "Command execution error",
          "[ERROR] Validation rule failed",
        ],
        expectedSuccess: false,
      },
      {
        name: "empty output",
        stdout: "",
        stderr: "",
        expectedErrors: [],
        expectedSuccess: true,
      },
    ];

    test.each(outputParsingCases)(
      "should parse output correctly: $name",
      ({ stdout, stderr, expectedErrors, expectedSuccess }) => {
        const result = (runner as any).parseOutput(stdout, stderr);

        expect(result.success).toBe(expectedSuccess);
        expect(result.errors).toHaveLength(expectedErrors.length);
        expectedErrors.forEach((expectedError) => {
          expect(result.errors).toContain(expectedError);
        });
      }
    );
  });

  // ===== PARAMETERIZED RULE STRUCTURE TESTS =====
  describe("Rule Structure Integration (Parameterized)", () => {
    const ruleStructureCases: RuleStructureTestCase[] = [
      {
        name: "comprehensive security rules",
        templatePath: "templates/ecs-service.yaml",
        rules: [
          "cfn-guard/rules/baseline/security-baseline.guard",
          "cfn-guard/rules/iam/iam-security.guard",
          "cfn-guard/rules/networking/networking-security.guard",
          "cfn-guard/rules/ecs/ecs-security.guard",
          "cfn-guard/rules/kms/encryption-security.guard",
        ],
        expectedSuccess: true,
        mockOutput: "[INFO] All security rules passed",
        description: "comprehensive security validation for ECS service",
      },
      {
        name: "ECS-specific rules only",
        templatePath: "templates/ecs-cluster.yaml",
        rules: [
          "cfn-guard/rules/ecs/ecs-security.guard",
          "cfn-guard/rules/ecs/ecs-network-security.guard",
          "cfn-guard/rules/ecs/ecs-service.guard",
        ],
        expectedSuccess: true,
        mockOutput: `
          [INFO] ECS security validation
          [INFO] Task definition security: PASS
          [INFO] Service network security: PASS
        `,
        description: "ECS-focused security validation",
      },
      {
        name: "baseline rules only",
        templatePath: "templates/basic-template.yaml",
        rules: ["cfn-guard/rules/baseline/security-baseline.guard"],
        expectedSuccess: true,
        mockOutput: "[INFO] Baseline security validation passed",
        description: "minimal baseline security check",
      },
      {
        name: "networking and load balancer rules",
        templatePath: "templates/alb-template.yaml",
        rules: [
          "cfn-guard/rules/networking/networking-security.guard",
          "cfn-guard/rules/networking/load-balancer-security.guard",
          "cfn-guard/rules/ssl/ssl-security.guard",
        ],
        expectedSuccess: true,
        mockOutput: "[INFO] Network and SSL validation passed",
        description: "networking-focused validation for ALB",
      },
      {
        name: "compliance and monitoring rules",
        templatePath: "templates/compliance-template.yaml",
        rules: [
          "cfn-guard/rules/compliance/compliance.guard",
          "cfn-guard/rules/monitoring/monitoring.guard",
          "cfn-guard/rules/cost/cost-optimisation.guard",
        ],
        expectedSuccess: true,
        mockOutput: "[INFO] Compliance and monitoring validation passed",
        description: "governance-focused validation",
      },
      {
        name: "failed security validation",
        templatePath: "templates/insecure-template.yaml",
        rules: [
          "cfn-guard/rules/baseline/security-baseline.guard",
          "cfn-guard/rules/iam/iam-security.guard",
        ],
        expectedSuccess: false,
        mockOutput: `
          [ERROR] IAM policy allows wildcards in actions
          [FAIL] Security group allows inbound traffic from 0.0.0.0/0
          [VIOLATION] S3 bucket has public read access enabled
        `,
        description: "validation with security violations",
      },
    ];

    test.each(ruleStructureCases)(
      "should handle rule structure: $name",
      async ({
        templatePath,
        rules,
        expectedSuccess,
        mockOutput,
        description,
      }) => {
        const mockChildProcess = createMockChildProcess();
        mockedSpawn.mockReturnValue(mockChildProcess);

        const promise = runner.validate(templatePath, rules);

        // Simulate the appropriate response
        mockChildProcess.stdout.emit("data", Buffer.from(mockOutput));
        mockChildProcess.emit("close", expectedSuccess ? 0 : 1);

        const result = await promise;

        expect(result.success).toBe(expectedSuccess);
        expect(result.template).toBe(templatePath);
        expect(result.rules).toEqual(rules);
        expect(mockedSpawn).toHaveBeenCalledTimes(1);

        // Verify command structure
        const [command, args] = mockedSpawn.mock.calls[0];
        expect(command).toBe("cfn-guard");
        expect(args).toContain("validate");
        expect(args).toContain("--data");
        expect(args).toContain(templatePath);

        // Verify rules are included
        rules.forEach((rule) => {
          expect(args).toContain(rule);
        });
      }
    );
  });

  // ===== PARAMETERIZED EDGE CASES =====
  describe("Edge Cases (Parameterized)", () => {
    const edgeCases: EdgeCaseTestCase[] = [
      {
        name: "empty rule array",
        templatePath: "template.yaml",
        rules: [],
        expectedBehavior: "success",
        mockOutput: "[INFO] No rules to validate",
        description: "should handle validation with no rules",
      },
      {
        name: "very long template path",
        templatePath:
          "/very/long/path/to/template/that/might/cause/issues/in/some/systems.yaml",
        rules: ["rule.guard"],
        expectedBehavior: "success",
        mockOutput: "[INFO] Success",
        description: "should handle extremely long file paths",
      },
      {
        name: "template path with spaces",
        templatePath: "path with spaces/template-name.yaml",
        rules: ["rule.guard"],
        expectedBehavior: "success",
        mockOutput: "[INFO] Success",
        description: "should handle paths containing spaces",
      },
      {
        name: "template path with special characters",
        templatePath: "path/template-with-special-chars_@#$.yaml",
        rules: ["rule.guard"],
        expectedBehavior: "success",
        mockOutput: "[INFO] Success",
        description: "should handle special characters in paths",
      },
      {
        name: "very deep rule path",
        templatePath: "template.yaml",
        rules: [
          "cfn-guard/rules/very/deep/nested/structure/specific-rule.guard",
        ],
        expectedBehavior: "success",
        mockOutput: "[INFO] Success",
        description: "should handle deeply nested rule paths",
      },
      {
        name: "many rules (performance test)",
        templatePath: "template.yaml",
        rules: Array.from({ length: 25 }, (_, i) => `rule${i}.guard`),
        expectedBehavior: "success",
        mockOutput: "[INFO] All 25 rules passed",
        description: "should handle large number of rules efficiently",
      },
    ];

    test.each(edgeCases)(
      "should handle edge case: $name",
      async ({
        templatePath,
        rules,
        expectedBehavior,
        mockOutput,
        description,
      }) => {
        const mockChildProcess = createMockChildProcess();
        mockedSpawn.mockReturnValue(mockChildProcess);

        const promise = runner.validate(templatePath, rules);

        // Simulate response
        mockChildProcess.stdout.emit("data", Buffer.from(mockOutput));
        mockChildProcess.emit("close", expectedBehavior === "success" ? 0 : 1);

        const result = await promise;

        if (expectedBehavior === "success") {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }

        expect(result.template).toBe(templatePath);
        expect(result.rules).toEqual(rules);
        expect(mockedSpawn).toHaveBeenCalledTimes(1);

        // Verify template path is preserved correctly
        const [, args] = mockedSpawn.mock.calls[0];
        expect(args).toContain(templatePath);
      }
    );
  });

  // ===== PARAMETERIZED PROCESS ERROR TESTS =====
  describe("Process Error Handling (Parameterized)", () => {
    const processErrorCases: ProcessErrorTestCase[] = [
      {
        name: "command not found",
        errorType: "ENOENT",
        errorMessage: "Command not found",
        expectedErrorPattern: "Failed to execute command: Command not found",
      },
      {
        name: "permission denied",
        errorType: "EACCES",
        errorMessage: "Permission denied",
        expectedErrorPattern: "Failed to execute command: Permission denied",
      },
      {
        name: "process timeout",
        errorType: "TIMEOUT",
        errorMessage: "Process timeout",
        expectedErrorPattern: "Failed to execute command: Process timeout",
      },
      {
        name: "out of memory",
        errorType: "ENOMEM",
        errorMessage: "Out of memory",
        expectedErrorPattern: "Failed to execute command: Out of memory",
      },
      {
        name: "network error",
        errorType: "ENETUNREACH",
        errorMessage: "Network unreachable",
        expectedErrorPattern: "Failed to execute command: Network unreachable",
      },
    ];

    test.each(processErrorCases)(
      "should handle process error: $name",
      async ({ errorMessage, expectedErrorPattern }) => {
        const mockChildProcess = createMockChildProcess();
        mockedSpawn.mockReturnValue(mockChildProcess);

        const promise = runner.validate("template.yaml", ["rule.guard"]);

        // Simulate process error
        setImmediate(() => {
          mockChildProcess.emit("error", new Error(errorMessage));
        });

        await expect(promise).rejects.toThrow(expectedErrorPattern);
      }
    );
  });

  // ===== PARAMETERIZED LOGGING TESTS =====
  describe("Logging Integration (Parameterized)", () => {
    interface LoggingTestCase {
      name: string;
      templatePath: string;
      rules: string[];
      mockOutput: string;
      exitCode: number;
      expectedLogCalls: {
        info?: string[];
        success?: string[];
        error?: string[];
        debug?: string[];
      };
    }

    const loggingCases: LoggingTestCase[] = [
      {
        name: "successful validation logging",
        templatePath: "template.yaml",
        rules: ["rule.guard"],
        mockOutput: "[INFO] Success",
        exitCode: 0,
        expectedLogCalls: {
          info: ["Validating template: template.yaml"],
          success: ["Template validation passed"],
        },
      },
      {
        name: "failed validation logging",
        templatePath: "template.yaml",
        rules: ["rule.guard"],
        mockOutput: "[ERROR] Rule failed",
        exitCode: 1,
        expectedLogCalls: {
          info: ["Validating template: template.yaml"],
          error: ["Template validation failed"],
        },
      },
      {
        name: "multiple rules logging",
        templatePath: "complex-template.yaml",
        rules: ["rule1.guard", "rule2.guard", "rule3.guard"],
        mockOutput: "[INFO] All rules passed",
        exitCode: 0,
        expectedLogCalls: {
          info: ["Validating template: complex-template.yaml"],
          debug: ["Using 3 rule(s): rule1.guard, rule2.guard, rule3.guard"],
          success: ["Template validation passed"],
        },
      },
    ];

    test.each(loggingCases)(
      "should log correctly: $name",
      async ({
        templatePath,
        rules,
        mockOutput,
        exitCode,
        expectedLogCalls,
      }) => {
        const mockChildProcess = createMockChildProcess();
        mockedSpawn.mockReturnValue(mockChildProcess);

        const promise = runner.validate(templatePath, rules);

        mockChildProcess.stdout.emit("data", Buffer.from(mockOutput));
        mockChildProcess.emit("close", exitCode);

        await promise;

        // Verify expected log calls
        if (expectedLogCalls.info) {
          expectedLogCalls.info.forEach((message) => {
            expect(mockedLogger.info).toHaveBeenCalledWith(
              expect.stringContaining(message)
            );
          });
        }

        if (expectedLogCalls.success) {
          expectedLogCalls.success.forEach((message) => {
            expect(mockedLogger.success).toHaveBeenCalledWith(
              expect.stringContaining(message)
            );
          });
        }

        if (expectedLogCalls.error) {
          expectedLogCalls.error.forEach((message) => {
            expect(mockedLogger.error).toHaveBeenCalledWith(
              expect.stringContaining(message)
            );
          });
        }

        if (expectedLogCalls.debug) {
          expectedLogCalls.debug.forEach((message) => {
            expect(mockedLogger.debug).toHaveBeenCalledWith(
              expect.stringContaining(message)
            );
          });
        }
      }
    );
  });

  // ===== CORE FUNCTIONALITY TESTS (Non-parameterized) =====
  describe("Main Validation", () => {
    it("should validate template with rules successfully", async () => {
      const templatePath = "path/to/template.yaml";
      const rulesPath = ["path/to/rules1.guard", "path/to/rules2.guard"];

      const mockChildProcess = createMockChildProcess();
      mockedSpawn.mockReturnValue(mockChildProcess);

      const validationPromise = runner.validate(templatePath, rulesPath);

      mockChildProcess.stdout.emit(
        "data",
        Buffer.from("Validation successful")
      );
      mockChildProcess.emit("close", 0);

      const result = await validationPromise;

      expect(result.success).toBe(true);
      expect(result.template).toBe(templatePath);
      expect(result.stdout).toBe("Validation successful");
      expect(result.stderr).toBe("");
      expect(result.exitCode).toBe(0);
      expect(result.tool).toBe("cfn-guard");
      expect(typeof result.duration).toBe("number");
    });
  });

  // ===== METHOD VERIFICATION =====
  describe("Method Signatures Verification", () => {
    it("should have required public methods", () => {
      expect(typeof runner.validate).toBe("function");
      expect(typeof runner.quickValidate).toBe("function");
      expect(typeof runner.getVersion).toBe("function");
    });

    it("should have parseOutput method for testing", () => {
      expect(typeof (runner as any).parseOutput).toBe("function");
    });
  });
});
