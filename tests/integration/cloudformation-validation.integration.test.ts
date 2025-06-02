import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";
import { CfnGuardTestHelper } from "../helpers/cfn-guard-helper";
import path from "path";
import fs from "fs";

describe("Production Cloudformation Templates Validation", () => {
  let runner: CfnGuardRunner;

  beforeEach(() => {
    runner = new CfnGuardRunner();
  });

  // Helper to find all CloudFormation templates
  const findCloudFormationTemplates = (baseDir: string): string[] => {
    const templates: string[] = [];

    const searchDirectories = [
      path.join(baseDir, "cloudformation"),
      path.join(baseDir, "templates"),
      path.join(baseDir, "infrastructure"),
      path.join(baseDir, "cfn"),
      path.join(baseDir, "aws"),
      path.join(baseDir, "stacks"),
      baseDir, // Also search root directory
    ];

    searchDirectories.forEach((dir) => {
      if (fs.existsSync(dir)) {
        console.log(`Searching for templates in: ${dir}`);
        templates.push(...scanForTemplates(dir));
      }
    });

    return templates;
  };

  const scanForTemplates = (dir: string): string[] => {
    const templates: string[] = [];
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursive search subdirectories
        templates.push(...scanForTemplates(fullPath));
      } else {
        // Check if file is a CloudFormation template
        const ext = path.extname(item).toLowerCase();
        const isTemplate = ext === ".yml" || ext === ".yaml" || ext === ".json";

        if (isTemplate && isCloudFormationTemplate(fullPath)) {
          templates.push(fullPath);
        }
      }
    });

    return templates;
  };

  const isCloudFormationTemplate = (filePath: string): boolean => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      // Check for CloudFormation indicators
      const cfnIndicators = [
        "AWSTemplateFormatVersion",
        "Resources:",
        "Parameters:",
        "Type: AWS::",
        'Type: "AWS::',
        '"Type": "AWS::',
      ];
      return cfnIndicators.some((indicator) => content.includes(indicator));
    } catch (error) {
      console.warn(`Cound not read files ${filePath}:`, error);
      return false;
    }
  };

  describe("Discover Template", () => {
    it("Should find all CloudFormation tempkates in the project", () => {
      const projectRoot = path.join(__dirname, "../../");
      const templates = findCloudFormationTemplates(projectRoot);

      console.log(`\nFound ${templates.length} CloudFormation templates:`);
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${path.relative(projectRoot, template)}`);
      });

      expect(templates.length).toBeGreaterThan(0);
    });
  });
});
