export interface ValidationResult {
  success: boolean;
  template: string;
  tool: "cfn-guard" | "rain";
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  errors: string[];
  rules: string[];
}

export interface GuardRule {
  name: string;
  path: string;
  category: "security" | "compliance" | "cost";
}

export interface templateConfig {
  name: string;
  path: string;
  rules: GuardRule[];
  enabled: boolean;
}
