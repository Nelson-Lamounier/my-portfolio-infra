import { TemplateValidator } from "../../helpers/validator";
import { Logger, LogLevel } from "../../../src/utils/Logger";
import path from "path";
import fs from "fs";
import { performance } from "perf_hooks";

describe("Template Discovery Engine", () => {
  const projectRoot = path.join(__dirname, "../../../");
  let discoveredTemplates: string[] = [];
  let templatesByDomain: Record<string, string[]> = {};

  beforeAll(() => {
    Logger.configure({
      level: process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO,
      enableTimestamps: false,
      enableColors: true,
      prefix: "DISCOVERY",
    });

    Logger.separator("TEMPLATE DISCOVERY ENGINE TESTS");
  });

  afterAll(() => {
    Logger.separator("DISCOVERY TESTS COMPLETED");
    Logger.summary("Discovery Summary", {
      templatesFound: discoveredTemplates.length,
      domainsDetected: Object.keys(templatesByDomain).length,
      testSuite: "Template Discovery Engine",
    });
  });

  // ===== FILE SYSTEM SCANNING TESTS =====
  describe("File System Scanning", () => {
    it("should scan the templates directory correctly", () => {
      const testName = "File System Scanning";
      const startTime = performance.now();

      Logger.testStart(testName, "SCANNING");

      const templatesDir = path.join(projectRoot, "templates");

      // Test directory existence
      expect(fs.existsSync(templatesDir)).toBe(true);
      Logger.info(`Templates directory exists: ${templatesDir}`);

      // Test subdirectory scanning
      const subdirs = fs.readdirSync(templatesDir).filter((item) => {
        const fullPath = path.join(templatesDir, item);
        return fs.statSync(fullPath).isDirectory();
      });

      expect(subdirs.length).toBeGreaterThan(0);
      Logger.info(`Found ${subdirs.length} subdirectories:`, subdirs);

      // Verify expected directories exist
      const expectedDirs = ["core", "security", "networking", "compute"];
      const missingDirs = expectedDirs.filter((dir) => !subdirs.includes(dir));

      expect(missingDirs.length).toBe(0);
      Logger.success("All expected directories found");

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "SCANNING");
    });

    it("should handle missing directories gracefully", () => {
      const testName = "Missing Directory Handling";
      const startTime = performance.now();

      Logger.testStart(testName, "ERROR-HANDLING");

      // Test discovery with non-existent directory
      const fakeRoot = path.join(projectRoot, "non-existent-directory");
      const templates = TemplateValidator.discoverTemplates(fakeRoot);

      // Should return empty array, not throw error
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
      Logger.success("Gracefully handled missing directory");

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "ERROR-HANDLING");
    });

    it("should skip hidden files and directories", () => {
      const testName = "Hidden File Filtering";
      const startTime = performance.now();

      Logger.testStart(testName, "FILTERING");

      discoveredTemplates = TemplateValidator.discoverTemplates(projectRoot);

      // Check that no hidden files (.git, .vscode, etc.) are included
      const hiddenFiles = discoveredTemplates.filter((template) => {
        const parts = template.split(path.sep);
        return parts.some((part) => part.startsWith("."));
      });

      expect(hiddenFiles.length).toBe(0);
      Logger.success("No hidden files included in discovery");

      // Check that node_modules is excluded
      const nodeModulesFiles = discoveredTemplates.filter((template) =>
        template.includes("node_modules")
      );

      expect(nodeModulesFiles.length).toBe(0);
      Logger.success("node_modules directory properly excluded");

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "FILTERING");
    });
  });

  // ===== TEMPLATE DETECTION PATTERNS =====
  describe("Template Detection Patterns", () => {
    it("should detect CloudFormation file extensions", () => {
      const testName = "File Extension Detection";
      const startTime = performance.now();

      Logger.testStart(testName, "DETECTION");

      discoveredTemplates = TemplateValidator.discoverTemplates(projectRoot);

      // All discovered files should have valid CloudFormation extensions
      const validExtensions = [".yml", ".yaml", ".json"];
      const invalidFiles = discoveredTemplates.filter((template) => {
        const ext = path.extname(template);
        return !validExtensions.includes(ext);
      });

      expect(invalidFiles.length).toBe(0);
      Logger.success(
        "All discovered files have valid CloudFormation extensions"
      );

      // Log extension breakdown
      const extensionCounts = validExtensions.reduce((acc, ext) => {
        acc[ext] = discoveredTemplates.filter(
          (t) => path.extname(t) === ext
        ).length;
        return acc;
      }, {} as Record<string, number>);

      Logger.info("Extension breakdown:", extensionCounts);

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "DETECTION");
    });

    it("should detect CloudFormation content patterns", () => {
      const testName = "Content Pattern Detection";
      const startTime = performance.now();

      Logger.testStart(testName, "DETECTION");

      // Test a few discovered templates for CloudFormation indicators
      const samplesToTest = discoveredTemplates.slice(0, 5);
      let validTemplateCount = 0;

      samplesToTest.forEach((templatePath) => {
        try {
          const content = fs.readFileSync(templatePath, "utf8");

          // Check for CloudFormation indicators
          const cfnIndicators = [
            "AWSTemplateFormatVersion",
            "Resources:",
            "Type: AWS::",
            'Type: "AWS::',
            "Ref:",
            "!Ref",
            "!GetAtt",
          ];

          const hasIndicators = cfnIndicators.some((indicator) =>
            content.includes(indicator)
          );

          if (hasIndicators) {
            validTemplateCount++;
            Logger.debug(
              `✓ ${path.basename(
                templatePath
              )} contains CloudFormation patterns`
            );
          }
        } catch (error) {
          Logger.error("No core templates found after all selection attempts");
          Logger.warn(`Could not read ${templatePath}:`, error);
        }
      });

      expect(validTemplateCount).toBeGreaterThan(0);
      Logger.success(
        `${validTemplateCount}/${samplesToTest.length} templates contain CloudFormation patterns`
      );

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "DETECTION");
    });
  });

  // ===== DOMAIN CATEGORIZATION =====
  describe("Domain Categorization", () => {
    it("should categorize templates by domain correctly", () => {
      const testName = "Domain Categorization";
      const startTime = performance.now();

      Logger.testStart(testName, "CATEGORIZATION");

      templatesByDomain = TemplateValidator.getTemplatesByDomain();

      // Should have multiple domains
      const domains = Object.keys(templatesByDomain);
      expect(domains.length).toBeGreaterThan(0);
      Logger.info(`Found ${domains.length} domains:`, domains);

      // Verify expected domains exist
      const expectedDomains = ["core", "security", "networking", "compute"];
      const foundExpectedDomains = expectedDomains.filter(
        (domain) =>
          domains.includes(domain) && templatesByDomain[domain].length > 0
      );

      expect(foundExpectedDomains.length).toBeGreaterThan(0);
      Logger.success(
        `Found ${foundExpectedDomains.length} expected domains with templates`
      );

      // Log domain distribution
      Object.entries(templatesByDomain).forEach(([domain, templates]) => {
        if (templates.length > 0) {
          Logger.info(`${domain}: ${templates.length} templates`);
        }
      });

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "CATEGORIZATION");
    });

    it("should handle domain inference from file paths", () => {
      const testName = "Domain Path Inference";
      const startTime = performance.now();

      Logger.testStart(testName, "CATEGORIZATION");

      // Test domain inference logic
      const testCases = [
        { path: "templates/core/vpc.yml", expectedDomain: "core" },
        { path: "templates/security/iam.yml", expectedDomain: "security" },
        { path: "templates/networking/alb.yml", expectedDomain: "networking" },
        { path: "templates/compute/ecs.yml", expectedDomain: "compute" },
      ];

      testCases.forEach(({ path: testPath, expectedDomain }) => {
        const domain = getDomainFromPath(testPath);
        expect(domain).toBe(expectedDomain);
        Logger.debug(`✓ ${testPath} → ${domain}`);
      });

      Logger.success("Domain inference working correctly");

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "CATEGORIZATION");
    });
  });

  // ===== DISCOVERY PERFORMANCE =====
  describe("Discovery Performance", () => {
    it("should discover templates within reasonable time", () => {
      const testName = "Discovery Performance";
      const startTime = performance.now();

      Logger.testStart(testName, "PERFORMANCE");

      // Measure discovery performance
      const discoveryStart = performance.now();
      const templates = TemplateValidator.discoverTemplates(projectRoot);
      const discoveryEnd = performance.now();

      const discoveryTime = discoveryEnd - discoveryStart;
      const templatesPerMs = templates.length / discoveryTime;

      Logger.info("Performance metrics:", {
        templatesFound: templates.length,
        discoveryTime: `${Math.round(discoveryTime)}ms`,
        templatesPerMs: templatesPerMs.toFixed(2),
      });

      // Performance expectations
      expect(discoveryTime).toBeLessThan(5000); // Less than 5 seconds
      expect(templatesPerMs).toBeGreaterThan(0.1); // At least 0.1 templates per ms

      Logger.success(`Discovery completed in ${Math.round(discoveryTime)}ms`);

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "PERFORMANCE");
    });

    it("should provide discovery statistics", () => {
      const testName = "Discovery Statistics";
      const startTime = performance.now();

      Logger.testStart(testName, "STATISTICS");

      discoveredTemplates = TemplateValidator.discoverTemplates(projectRoot);
      templatesByDomain = TemplateValidator.getTemplatesByDomain();

      // Basic statistics
      const stats = {
        totalTemplates: discoveredTemplates.length,
        totalDomains: Object.keys(templatesByDomain).length,
        averageTemplatesPerDomain:
          discoveredTemplates.length / Object.keys(templatesByDomain).length,
        largestDomain: Object.entries(templatesByDomain).reduce(
          (max, [domain, templates]) =>
            templates.length > max.count
              ? { domain, count: templates.length }
              : max,
          { domain: "", count: 0 }
        ),
      };

      Logger.info("Discovery statistics:", stats);

      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.totalDomains).toBeGreaterThan(0);
      expect(stats.averageTemplatesPerDomain).toBeGreaterThan(0);

      const duration = performance.now() - startTime;
      Logger.testEnd(testName, true, Math.round(duration), "STATISTICS");
    });
  });
});

// ===== HELPER FUNCTIONS (Discovery-focused only) =====
function getDomainFromPath(relativePath: string): string {
  const pathParts = relativePath.split("/");

  // Look for domain in path
  const knownDomains = [
    "core",
    "security",
    "networking",
    "compute",
    "pipelines",
    "stacks",
    "storage",
  ];
  const foundDomain = pathParts.find((part) => knownDomains.includes(part));

  return foundDomain || "other";
}
