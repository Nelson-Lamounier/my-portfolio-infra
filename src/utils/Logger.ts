// Logger utility for consistent logging across the application
// This utility provides methods for logging messages with different severity levels
// such as info, success, error, warn, and debug.
// It uses the 'chalk' library to colorize the output in the console for better visibility.

import chalk from "chalk";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  prefix?: string;
}

export class Logger {
  private static config: LogConfig = {
    level: process.env.NODE_ENV === "test" ? LogLevel.WARN : LogLevel.INFO,
    enableTimestamps: true,
    enableColors: true,
    prefix: undefined,
  };

  // ===== CONFIGURATION METHODS =====
  static configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  static setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  // ===== PRIVATE HELPER METHODS =====
  private static shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private static formatMessage(
    level: string,
    message: string,
    data?: any
  ): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.config.enableTimestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // Add prefix if set
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    // Add level
    parts.push(`[${level}]`);

    // Add message
    parts.push(message);

    // Add data if provided
    if (data !== undefined) {
      parts.push(`\n  Data: ${JSON.stringify(data, null, 2)}`);
    }

    return parts.join(" ");
  }

  private static colorize(message: string, color: keyof typeof chalk): string {
    if (!this.config.enableColors) return message;
    return (chalk[color] as any)(message);
  }

  // ===== BASIC LOGGING METHODS =====
  static info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage("INFO", message, data);
    console.log(this.colorize(formatted, "blue"));
  }

  static success(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage("SUCCESS", message, data);
    console.log(this.colorize(formatted, "green"));
  }

  static error(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formatted = this.formatMessage("ERROR", message, data);
    console.error(this.colorize(formatted, "red"));
  }

  static warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formatted = this.formatMessage("WARN", message, data);
    console.warn(this.colorize(formatted, "yellow"));
  }

  static debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formatted = this.formatMessage("DEBUG", message, data);
    console.debug(this.colorize(formatted, "gray"));
  }

  // ===== TEST-SPECIFIC LOGGING METHODS =====
  static testStart(testName: string, category: string = "TEST"): void {
    this.info(`🚀 Starting ${category}: ${testName}`);
  }

  static testEnd(
    testName: string,
    success: boolean,
    duration: number,
    category: string = "TEST"
  ): void {
    const status = success ? "PASSED" : "FAILED";
    const message = `${status} ${category}: ${testName} (${duration}ms)`;

    if (success) {
      this.success(message);
    } else {
      this.error(message);
    }
  }

  static validationResult(templateName: string, result: any): void {
    if (result.success) {
      this.success(` ${templateName} validation passed`, {
        duration: result.duration,
        rules: result.rules?.length || 0,
      });
    } else {
      this.warn(` ${templateName} validation failed`, {
        errors: result.guardErrors?.length || 0,
        duration: result.duration,
        firstError: result.guardErrors?.[0],
      });
    }
  }

  // ===== DOMAIN-SPECIFIC LOGGING METHODS =====
  static security(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage("SECURITY", message, data);
    console.log(this.colorize(formatted, "redBright"));
  }

  static validation(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage("VALIDATION", message, data);
    console.log(this.colorize(formatted, "cyan"));
  }

  static timing(operation: string, duration: number, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const message = `⏱️ ${operation} completed in ${duration}ms`;
    const formatted = this.formatMessage("TIMING", message, data);
    console.log(this.colorize(formatted, "magenta"));
  }

  static rule(ruleName: string, result: "PASS" | "FAIL", details?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const icon = result === "PASS" ? "✅" : "❌";
    const message = `${icon} Rule: ${ruleName} - ${result}`;
    const formatted = this.formatMessage("RULE", message, details);
    console.log(this.colorize(formatted, result === "PASS" ? "green" : "red"));
  }

  static template(templateName: string, action: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const message = ` Template: ${templateName} - ${action}`;
    const formatted = this.formatMessage("TEMPLATE", message, data);
    console.log(this.colorize(formatted, "blue"));
  }

  static domain(domainName: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage(
      `DOMAIN:${domainName.toUpperCase()}`,
      message,
      data
    );
    console.log(this.colorize(formatted, "blueBright"));
  }

  // ===== SUMMARY AND REPORTING METHODS =====
  static summary(title: string, stats: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    console.log(this.colorize(`\n === ${title.toUpperCase()} ===`, "bold"));
    Object.entries(stats).forEach(([key, value]) => {
      const displayKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      console.log(this.colorize(`  ${displayKey}: ${value}`, "white"));
    });
    console.log(this.colorize("=".repeat(title.length + 10), "bold"));
  }

  static progress(current: number, total: number, operation: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const percentage = ((current / total) * 100).toFixed(1);
    const message = ` Progress: ${current}/${total} (${percentage}%) - ${operation}`;
    console.log(this.colorize(message, "cyan"));
  }

  static separator(title?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const line = "=".repeat(80);
    if (title) {
      const padding = Math.max(0, (80 - title.length - 4) / 2);
      const paddedTitle =
        "=".repeat(Math.floor(padding)) +
        ` ${title} ` +
        "=".repeat(Math.ceil(padding));
      console.log(this.colorize(paddedTitle, "bold"));
    } else {
      console.log(this.colorize(line, "gray"));
    }
  }

  // ===== UTILITY METHODS =====
  static table(data: Array<Record<string, any>>, title?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (title) {
      this.info(` ${title}`);
    }

    if (data.length === 0) {
      this.warn("No data to display");
      return;
    }

    console.table(data);
  }

  static group(title: string, fn: () => void): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    console.group(this.colorize(` ${title}`, "bold"));
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }

  // ===== CONDITIONAL LOGGING =====
  static logIf(
    condition: boolean,
    level: "info" | "warn" | "error" | "debug" | "success",
    message: string,
    data?: any
  ): void {
    if (condition) {
      this[level](message, data);
    }
  }

  // ===== MOCKING SUPPORT FOR TESTS =====
  static mock(): {
    info: jest.Mock;
    success: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    restore: () => void;
  } {
    const originalMethods = {
      info: this.info,
      success: this.success,
      error: this.error,
      warn: this.warn,
      debug: this.debug,
    };

    const mocks = {
      info: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      restore: () => {
        Object.assign(this, originalMethods);
      },
    };

    Object.assign(this, mocks);
    return mocks;
  }
}
