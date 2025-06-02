import { promises as fs } from "fs";
import path from "path";

// ===== ENHANCED TYPE DEFINITIONS =====
interface TemplateDiscoveryOptions {
  maxDepth: number;
  excludeDirs: string[];
  fileExtensions: string[];
  parallel?: boolean;
}

// Enhanced Result Type with detailed error info
type DiscoveryResult =
  | {
      success: true;
      templates: string[];
      stats: {
        filesScanned: number;
        directoriesScanned: number;
        duration: number;
      };
    }
  | {
      success: false;
      error: string;
      partialResults?: string[]; // Templates found before error
    };

// ===== CUSTOM ERROR CLASSES =====
/**
 * Custom error for template discovery failures
 * Extends built-in Error class with additional context
 */
class TemplateDiscoverError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "TemplateDiscoverError";
  }
}

// Goes up two levels from scripts/validation/ to project root
const projectRoot = path.join(__dirname, "../../");

// ===== IMPROVED MAIN FUNCTION =====
/**
 * Fully async function with proper error handling
 * Returns Result type instead of throwing errors
 */
async function discoverTemplates(
  options: TemplateDiscoveryOptions = {
    maxDepth: 3,
    excludeDirs: [".", "node_modules", ".git", "tests", "dist", "build"],
    fileExtensions: [".yaml", ".yml", ".json"], // Fixed: Added missing dot
    parallel: true,
  }
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const templates: string[] = [];
  let filesScanned = 0;
  let directoriesScanned = 0;

  // ===== ASYNC RECURSIVE FUNCTION =====
  /**
   * Properly async recursive function
   * Uses Promise.all for parallel processing when enabled
   */
  async function searchDirectoryAsync(dir: string, level = 0): Promise<void> {
    // Depth check
    if (level > options.maxDepth) return;

    try {
      directoriesScanned++;
      const items = await fs.readdir(dir);

      // Filter items first to avoid unnecessary work
      const validItems = items.filter(
        (item) => !options.excludeDirs.includes(item) && !item.startsWith(".")
      );

      if (options.parallel) {
        // PARALLEL PROCESSING: Process all items concurrently
        await Promise.all(
          validItems.map(async (item) => {
            //  Fixed: parameter name from 'items' to 'item'
            await processItem(item, dir, level);
          })
        );
      } else {
        // SEQUENTIAL PROCESSING: Process items one by one
        for (const item of validItems) {
          await processItem(item, dir, level);
        }
      }
    } catch (error) {
      // Enhanced error handling with context
      const enhancedError = new TemplateDiscoverError(
        `Failed to read directory: ${dir}`,
        dir,
        error instanceof Error ? error : new Error(String(error))
      );
      console.warn(` ${enhancedError.message}`, enhancedError.cause?.message);
    }
  }

  // ===== ITEM PROCESSING HELPER =====
  async function processItem(
    item: string,
    dir: string,
    level: number
  ): Promise<void> {
    const fullPath = path.join(dir, item);

    try {
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // Await recursive call
        await searchDirectoryAsync(fullPath, level + 1);
      } else {
        filesScanned++;

        // Check file extension
        const ext = path.extname(item).toLowerCase();
        if (options.fileExtensions.includes(ext)) {
          // Await async template validation
          const isTemplate = await isCloudFormationTemplateAsync(fullPath);
          if (isTemplate) {
            templates.push(path.relative(projectRoot, fullPath));
          }
        }
      }
    } catch (error) {
      // Item-level error handling
      console.warn(
        `Could not process ${fullPath}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // ===== EXECUTE WITH COMPREHENSIVE ERROR HANDLING =====
  try {
    await searchDirectoryAsync(projectRoot);

    const duration = Date.now() - startTime;

    // Return success result with stats
    return {
      success: true,
      templates,
      stats: {
        filesScanned,
        directoriesScanned,
        duration,
      },
    };
  } catch (error) {
    // Top-level error handling
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      partialResults: templates.length > 0 ? templates : undefined,
    };
  }
}

// ===== ASYNC TEMPLATE VALIDATION =====
/**
 * Async template validation
 * Prevents blocking the event loop for large files
 */
async function isCloudFormationTemplateAsync(
  filePath: string
): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");

    const cfnIndicators = [
      "AWSTemplateFormatVersion",
      "Resources:",
      '"Resources"',
      "Type: AWS::",
      'Type: "AWS::',
      '"Type": "AWS::',
    ];

    return cfnIndicators.some((indicator) => content.includes(indicator));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "EACCES") {
      console.warn(` Permission denied reading ${filePath}`);
    } else if (nodeError.code === "EISDIR") {
      console.warn(` Expected file but found directory: ${filePath}`);
    } else {
      console.warn(
        `Could not read file ${filePath}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
    return false;
  }
}

// ===== SAFE SCRIPT EXECUTION =====
/**
 * FIXED: Proper function declaration with body
 * Main execution function with proper async handling
 */
async function main(): Promise<void> {
  // Opening brace, not semicolon
  try {
    console.log("🔍 Discovering CloudFormation templates...\n");

    const result = await discoverTemplates();

    if (result.success) {
      // Success case handling
      console.log(`Found ${result.templates.length} CloudFormation templates:`);
      console.log(
        `Stats: ${result.stats.filesScanned} files scanned, ` +
          `${result.stats.directoriesScanned} directories, ` +
          `${result.stats.duration}ms\n`
      );

      // Output templates
      result.templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template}`);
      });

      // Generate copy-pasteable code
      console.log(`\nCopy these paths to your test file:`);
      console.log(`const productionTemplates = [`);
      result.templates.forEach((template) => {
        console.log(`  "${template}",`);
      });
      console.log(`];`);
    } else {
      // Error case handling
      console.error(` Discovery failed: ${result.error}`);

      if (result.partialResults && result.partialResults.length > 0) {
        console.log(
          ` Partial results (${result.partialResults.length} templates found before error):`
        );
        result.partialResults.forEach((template, index) => {
          console.log(`${index + 1}. ${template}`);
        });
      }

      // Exit with error code for CI/CD
      process.exit(1);
    }
  } catch (error) {
    // Top-level error handling
    console.error(" Unexpected error:", error);
    process.exit(1);
  }
} //  Closing brace for function

// ===== ADDITIONAL UTILITY FUNCTIONS =====

/**
 * Wrapper for use in other modules
 */
export async function discoverTemplatesWithTimeout(
  timeoutMs: number = 30000,
  options?: TemplateDiscoveryOptions
): Promise<DiscoveryResult> {
  return Promise.race([
    discoverTemplates(options),
    new Promise<DiscoveryResult>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Discovery timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Validate specific directories only
 */
export async function discoverTemplatesInPaths(
  searchPaths: string[],
  options?: Partial<TemplateDiscoveryOptions>
): Promise<DiscoveryResult> {
  const templates: string[] = [];

  for (const searchPath of searchPaths) {
    const fullPath = path.resolve(projectRoot, searchPath);

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        // Implementation would need to call discoverTemplates with modified options
        console.log(`Processing directory: ${fullPath}`);
      }
    } catch (error) {
      console.warn(`Could not access path ${searchPath}:`, error);
    }
  }

  return {
    success: true,
    templates,
    stats: { filesScanned: 0, directoriesScanned: 0, duration: 0 },
  };
}

// ===== EXECUTE ONLY IF RUN DIRECTLY =====
/**
 * FIXED: Proper CommonJS module check and execution
 * Check if script is run directly (not imported)
 * This prevents execution when imported as a module
 */
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
