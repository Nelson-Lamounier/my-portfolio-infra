import path from "path";
import fs from "fs";
import { CfnGuardRunner } from "../../src/utils/CfnGuardRunner";

export class CfnGuardTestHelper {
  private static cfnGuardPath = path.join(__dirname, "../../cfn-guard");

  static getRulesByCategory(category: string): string[] {
    const categoryPath = path.join(this.cfnGuardPath, "rules", category);
    if (!fs.existsSync(categoryPath)) {
      throw new Error(`Rules category '${category}' not found`);
    }

    return fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".guard"))
      .map((file) => path.join(categoryPath, file));
  }

  static getAllRules(): string[] {
    const rulesPath = path.join(this.cfnGuardPath, "rules");
    const allRules: string[] = [];

    const scanDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith(".guard")) {
          allRules.push(fullPath);
        }
      });
    };

    scanDirectory(rulesPath);
    return allRules;
  }

  static async validateTemplate(
    templatePath: string,
    ruleCategories: string[]
  ) {
    const runner = new CfnGuardRunner();

    const rules: string[] = [];

    ruleCategories.forEach((category) => {
      rules.push(...this.getRulesByCategory(category));
    });

    return runner.validate(templatePath, rules);
  }
}
