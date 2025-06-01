// Import the class we're testing and required Node.js modules
import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import { spawn } from "child_process";
import { EventEmitter } from "events";

// Mock the child_process module to prevent actual command execution during tests
// This ensures tests are isolated and don't depend on external tools being installed
jest.mock("child_process");

// Create a typed mock of the spawn function for better TypeScript support
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Create a runner instance outside describe blocks (this should be moved inside)
const runner = new CfnGuardRunner();

/**
 * Helper function to create a mock child process that simulates cfn-guard execution
 * Returns an EventEmitter that can emit stdout, stderr, and close events
 */
function createMockChildProcess() {
  // Create a mock child process using EventEmitter as base
  const mockedChildProcess = new EventEmitter() as any; // Use 'any' to avoid type issues with EventEmitter

  // Add stdout and stderr streams as separate EventEmitters
  // These will simulate the output streams from a real child process
  mockedChildProcess.stdout = new EventEmitter();
  mockedChildProcess.stderr = new EventEmitter();

  return mockedChildProcess;
}

// Main test suite for the CfnGuardRunner class
describe("CfnGuardRunner", () => {
  let runner: CfnGuardRunner;

  // Setup that runs before each test to ensure clean state
  beforeEach(() => {
    // Create a fresh instance of CfnGuardRunner for each test
    runner = new CfnGuardRunner();
    // Clear all mock calls and instances to prevent test interference
    jest.clearAllMocks();
  });

  // Integration test for the main validate method
  it("should validate a template with rules", async () => {
    // Test data setup
    const templatePath = "path/to/template.yaml";
    const rulesPath = ["path/to/rules1.guard", "path/to/rules2.guard"];

    // Create a mock child process to simulate cfn-guard execution
    const mockChildProcess = createMockChildProcess();

    // Configure the spawn mock to return our mock child process
    mockedSpawn.mockReturnValue(mockChildProcess);

    // Start the validation process (returns a Promise)
    const validationPromise = runner.validate(templatePath, rulesPath);

    // Simulate successful cfn-guard output
    // Note: Should use Buffer.from() for consistency with real child_process behavior
    mockChildProcess.stdout.emit("data", "Validation successful");

    // Simulate process completion with exit code 0 (success)
    mockChildProcess.emit("close", 0);

    // Wait for the validation to complete and get the result
    const result = await validationPromise;

    // Verify all expected properties are set correctly
    expect(result.success).toBe(true);
    expect(result.template).toBe(templatePath);
    expect(result.stdout).toBe("Validation successful");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.tool).toBe("cfn-guard");
  });
});

// Test suite for the private buildCommand method
describe("buildCommand", () => {
  // Test command building with a single rule file
  it("should build the correct command and single rule", () => {
    // Access private method using type assertion (not ideal but necessary for testing)
    const command = (runner as any).buildCommand("template.yaml", [
      "rule.guard",
    ]);

    // Verify the command array contains all expected arguments in correct order
    expect(command).toEqual([
      "cfn-guard", // Main executable
      "validate", // Subcommand
      "--data", // Flag for template file
      "template.yaml", // Template file path
      "--rules", // Flag for rule file
      "rule.guard", // Rule file path
    ]);
  });

  // Test command building with multiple rule files
  it("Should build command with multiple rules", () => {
    // Access private method for testing
    const command = (runner as any).buildCommand("template.yaml", [
      "rule1.guard",
      "rule2.guard",
    ]);

    // Verify each rule gets its own --rules flag
    expect(command).toEqual([
      "cfn-guard",
      "validate",
      "--data",
      "template.yaml",
      "--rules",
      "rule1.guard",
      "--rules", // Each rule file needs its own --rules flag
      "rule2.guard",
    ]);
  });
});

// Test suite for the private executeCommand method
describe("executeCommand", () => {
  // Test successful command execution
  it("should execute the command and return output", async () => {
    // Setup mock child process
    const mockChildProcess = createMockChildProcess();
    mockedSpawn.mockReturnValue(mockChildProcess);

    // Start command execution (returns Promise)
    const promise = (runner as any).executeCommand(["cfn-guard", "validate"]);

    // Simulate stdout data arrival using Buffer (matches real child_process behavior)
    mockChildProcess.stdout.emit("data", Buffer.from("Success output"));

    // Simulate process completion
    mockChildProcess.emit("close", 0);

    // Wait for execution to complete
    const result = await promise;

    // Should be: expect(result).toEqual({...})
    expect(result).toEqual({
      stdout: "Success output",
      stderr: "",
      exitCode: 0,
    });
  });

  // Test error handling during command execution
  it("should handle process errors", async () => {
    // Setup mock child process
    const mockChildProcess = createMockChildProcess();
    mockedSpawn.mockReturnValue(mockChildProcess);

    // Start command execution
    const promise = (runner as any).executeCommand(["cfn-guard", "validate"]);

    // Simulate a process error (e.g., command not found)
    mockChildProcess.emit("error", new Error("Command not found"));

    // Verify the Promise rejects with the expected error message
    await expect(promise).rejects.toThrow(
      "Failed to execute command: Command not found"
    );
  });
});

// Test suite for the private parseOutput method
describe("parseOutput", () => {
  // Test parsing of successful validation output
  it("Should parse successful output with no errors", () => {
    // Sample stdout with informational messages only
    const stdout = `[INFO] Starting validation
        [INFO] All rules passed    
        [INFO] Validation complete`;
    const stderr = "";

    // Parse the output
    const result = (runner as any).parseOutput(stdout, stderr);

    // Verify successful parsing with no errors detected
    expect(result).toEqual({
      errors: [],
      success: true,
    });
  });

  // Test parsing of output with validation failures
  it("should parse output with validation failures", () => {
    // Sample stdout containing error and failure messages
    const stdout = `
      [INFO] Starting validation
      [ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed
      [FAIL] S3 bucket allows public read access
      [INFO] Validation complete
    `;
    const stderr = "";

    // Parse the output
    const result = (runner as any).parseOutput(stdout, stderr);

    // Verify errors are extracted and success is false
    expect(result).toEqual({
      errors: [
        "[ERROR] Rule S3_BUCKET_PUBLIC_READ_PROHIBITED failed",
        "[FAIL] S3 bucket allows public read access",
      ],
      success: false,
    });
  });

  // Test handling of stderr errors (execution problems)
  it("should include stderr errors", () => {
    const stdout = "";
    const stderr = "Template file not found"; // System error message

    // Parse the output
    const result = (runner as any).parseOutput(stdout, stderr);

    // Verify stderr errors are included in the errors array
    expect(result).toEqual({
      errors: ["Template file not found"],
      success: false,
    });
  });

  // Test parsing of VIOLATION keyword (another type of failure)
  it("should handle VIOLATION keyword", () => {
    const stdout = "[VIOLATION] Security group allows unrestricted access";
    const stderr = "";

    // Parse the output
    const result = (runner as any).parseOutput(stdout, stderr);

    // Verify VIOLATION messages are captured as errors
    expect(result).toEqual({
      errors: ["[VIOLATION] Security group allows unrestricted access"],
      success: false,
    });
  });
});

// Additional integration tests for the validate method
describe("validate", () => {
  // Test complete successful validation workflow
  it("should perform complete validation successfully", async () => {
    // Setup mock child process
    const mockChildProcess = createMockChildProcess();
    mockedSpawn.mockReturnValue(mockChildProcess);

    // Start validation
    const promise = runner.validate("template.yaml", ["rule.guard"]);

    // Simulate successful cfn-guard output
    mockChildProcess.stdout.emit(
      "data",
      Buffer.from("[INFO] All rules passed")
    );
    // Simulate successful completion
    mockChildProcess.emit("close", 0);

    // Wait for completion and verify results
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.template).toBe("template.yaml");
    expect(result.tool).toBe("cfn-guard");
    expect(result.errors).toEqual([]);
    expect(result.exitCode).toBe(0);
    expect(typeof result.duration).toBe("number"); // Verify duration is calculated
  });

  // Test validation failure handling
  it("should handle validation failures", async () => {
    // Setup mock child process
    const mockChildProcess = createMockChildProcess();
    mockedSpawn.mockReturnValue(mockChildProcess);

    // Start validation
    const promise = runner.validate("template.yaml", ["rule.guard"]);

    // Simulate failed validation output
    mockChildProcess.stdout.emit("data", Buffer.from("[ERROR] Rule failed"));
    // Simulate failure with non-zero exit code
    mockChildProcess.emit("close", 1);

    // Wait for completion and verify failure is handled correctly
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.errors).toContain("[ERROR] Rule failed");
    expect(result.exitCode).toBe(1);
  });
});
