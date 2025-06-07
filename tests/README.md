# Run with debug logging enabled

DEBUG=true yarn test:cfn-guard

# Run critical tests with detailed logging

DEBUG=true yarn test:critical

# Run comprehensive validation with logging

NODE_ENV=development yarn analyze:security

# Basic logging (INFO level)

yarn test:comprehensive

# Debug logging (shows all details)

LOG_LEVEL=debug yarn test:comprehensive

# Minimal logging (WARN level only)

LOG_LEVEL=warn yarn test:comprehensive

# With custom prefix

LOG_LEVEL=debug yarn test:comprehensive --prefix="CI-VALIDATION"

LOG_LEVEL=debug yarn test tests/templates/core/template-discovery.test.ts

LOG_LEVEL=debug yarn test tests/templates/core/validation-engine.test.ts

# Stop watchman

watchman shutdown-server

# Give full disk access to your terminal

# Go to: System Preferences > Security & Privacy > Privacy > Full Disk Access

# Add your terminal app (Terminal.app or iTerm)

# Restart watchman

watchman watch-del-all
watchman watch-project /Users/nelsonlamounier/Desktop/portfolio-projects/ViteProjects/nelsonPortfolio/portfolio-infrastructure

# Run the compute domain tests

yarn test tests/templates/domain/compute.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/compute.test.ts --verbose

# Run just the individual template tests

yarn test tests/templates/domain/compute.test.ts -t "Individual Template Validation"

# Run just the batch validation

yarn test tests/templates/domain/compute.test.ts -t "Compute Domain Validation"

# Run networking domain tests

yarn test tests/templates/domain/networking.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/networking.test.ts

# Run specific test types

yarn test tests/templates/domain/networking.test.ts -t "SSL"
yarn test tests/templates/domain/networking.test.ts -t "Load Balancer"
yarn test tests/templates/domain/networking.test.ts -t "Domain Validation"

# Run pipeline domain tests

yarn test tests/templates/domain/pipelines.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/pipelines.test.ts

# Run specific validation types

yarn test tests/templates/domain/pipelines.test.ts -t "CRITICAL"
yarn test tests/templates/domain/pipelines.test.ts -t "Deployment Readiness"
yarn test tests/templates/domain/pipelines.test.ts -t "IAM"

# Run security domain tests

yarn test tests/templates/domain/security.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/security.test.ts

# Run specific validation types

yarn test tests/templates/domain/security.test.ts -t "CRITICAL"
yarn test tests/templates/domain/security.test.ts -t "IAM"
yarn test tests/templates/domain/security.test.ts -t "KMS"

# Run comprehensive tests

yarn test tests/templates/integration/comprehensive.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/integration/comprehensive.test.ts

# Run specific test types

yarn test tests/templates/integration/comprehensive.test.ts -t "Security Rule Categories"
yarn test tests/templates/integration/comprehensive.test.ts -t "Full Integration"

# Run security analysis tests

yarn test tests/templates/security-analysis.test.ts --verbose

# Run with debug logging

LOG_LEVEL=debug yarn test tests/templates/security-analysis.test.ts

# Run specific test categories

yarn test tests/templates/security-analysis.test.ts -t "CRITICAL"
yarn test tests/templates/security-analysis.test.ts -t "Health"

Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting

🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation

tests/
├── helpers/
│ ├── validator.ts # Core validation engine (class-based)
│ └── test-utils.ts # Shared utilities
├── templates/
│ ├── core/ # Core validation tests
│ │ ├── template-discovery.test.ts
│ │ └── validation-engine.test.ts
│ ├── domain/ # Domain-specific tests
│ │ ├── security.test.ts
│ │ ├── networking.test.ts
│ │ ├── compute.test.ts
│ │ └── pipelines.test.ts
│ ├── integration/ # Cross-domain tests
│ │ └── comprehensive.test.ts
│ └── security-analysis.test.ts # Security-focused analysis
└── src/utils/
└── Logger.ts # Professional logging system

    # Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts

📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

# Template discovery

yarn test tests/templates/core/template-discovery.test.ts

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/core/template-discovery.test.ts

# Validation engine

yarn test tests/templates/core/validation-engine.test.ts

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/core/validation-engine.test.ts

Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

# All security tests

yarn test tests/templates/domain/security.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/security.test.ts

# Critical security validation only

yarn test tests/templates/domain/security.test.ts -t "CRITICAL"

# IAM-specific tests

yarn test tests/templates/domain/security.test.ts -t "IAM"

# KMS/encryption tests

yarn test tests/templates/domain/security.test.ts -t "KMS"

Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

# All networking tests

yarn test tests/templates/domain/networking.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/networking.test.ts

# SSL/TLS validation

yarn test tests/templates/domain/networking.test.ts -t "SSL"

# Load balancer tests

yarn test tests/templates/domain/networking.test.ts -t "Load Balancer"

# Domain validation

yarn test tests/templates/domain/networking.test.ts -t "Domain Validation"

GitHub Copilot
Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

📋 Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting
🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation
🏗️ Test Architecture
/
🚀 Getting Started
Prerequisites

# Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard
Quick Start

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts
📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

ts
Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

"
Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

"
Validation Standards:

SSL/TLS: Strict certificate validation
Load balancers: Security group and listener validation
DNS: Route53 record validation
Network ACLs: Traffic flow validation
💻 Compute Domain
Purpose: EC2, ECS, and auto-scaling validation

# All compute tests

yarn test tests/templates/domain/compute.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/compute.test.ts --verbose

# Individual template tests

yarn test tests/templates/domain/compute.test.ts -t "Individual Template Validation"

# Batch validation

yarn test tests/templates/domain/compute.test.ts -t "Compute Domain Validation"

GitHub Copilot
Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

📋 Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting
🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation
🏗️ Test Architecture
/
🚀 Getting Started
Prerequisites

# Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard
Quick Start

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts
📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

ts
Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

"
Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

"
Validation Standards:

SSL/TLS: Strict certificate validation
Load balancers: Security group and listener validation
DNS: Route53 record validation
Network ACLs: Traffic flow validation
💻 Compute Domain
Purpose: EC2, ECS, and auto-scaling validation

"
Validation Standards:

ECS services: Resource limits and networking
Launch templates: Security and compliance
Auto-scaling: Scaling policies and health checks
🔄 Pipelines Domain
Purpose: CI/CD pipeline and deployment validation

# All pipeline tests

yarn test tests/templates/domain/pipelines.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/domain/pipelines.test.ts

# Critical validation

yarn test tests/templates/domain/pipelines.test.ts -t "CRITICAL"

# Deployment readiness

yarn test tests/templates/domain/pipelines.test.ts -t "Deployment Readiness"

# IAM validation

yarn test tests/templates/domain/pipelines.test.ts -t "IAM"

GitHub Copilot
Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

📋 Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting
🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation
🏗️ Test Architecture
/
🚀 Getting Started
Prerequisites

# Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard
Quick Start

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts
📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

ts
Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

"
Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

"
Validation Standards:

SSL/TLS: Strict certificate validation
Load balancers: Security group and listener validation
DNS: Route53 record validation
Network ACLs: Traffic flow validation
💻 Compute Domain
Purpose: EC2, ECS, and auto-scaling validation

"
Validation Standards:

ECS services: Resource limits and networking
Launch templates: Security and compliance
Auto-scaling: Scaling policies and health checks
🔄 Pipelines Domain
Purpose: CI/CD pipeline and deployment validation

"
Validation Standards:

CodePipeline: Stage and action validation
CodeBuild: Build environment security
Deployment: Rollback and monitoring capabilities
🔄 Integration Tests
📊 Comprehensive Validation
Purpose: Cross-domain validation and batch processing

# Full comprehensive suite

yarn test tests/templates/integration/comprehensive.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/integration/comprehensive.test.ts

# Security rule categories

yarn test tests/templates/integration/comprehensive.test.ts -t "Security Rule Categories"

# Full integration test

yarn test tests/templates/integration/comprehensive.test.ts -t "Full Integration"

Features:

Parameterized testing across rule categories
Batch validation for multiple templates
Performance benchmarking with timing
Development-friendly thresholds
🔐 Security Analysis
Purpose: Deep security analysis and health monitoring

# Full security analysis

yarn test tests/templates/security-analysis.test.ts --verbose

# With debug logging

LOG_LEVEL=debug yarn test tests/templates/security-analysis.test.ts

# Critical security validation

yarn test tests/templates/security-analysis.test.ts -t "CRITICAL"

# Health monitoring

yarn test tests/templates/security-analysis.test.ts -t "Health"

Features:

Issue categorization by severity and type
Health scoring for project security
Deployment blocking analysis for CI/CD
Actionable recommendations for improvements
🎮 Running Tests
Basic Test Execution

# Run all tests

yarn test

# Run tests with coverage

yarn test --coverage

# Run tests in watch mode

yarn test --watch

# Run specific test file

yarn test tests/templates/domain/security.test.ts

# Run by test name pattern

yarn test -t "should validate"

# Run by file pattern

yarn test tests/templates/domain/

# Run only failed tests

yarn test --onlyFailures

# Run tests in specific order

yarn test --testNamePattern="CRITICAL" --verbose

GitHub Copilot
Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

📋 Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting
🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation
🏗️ Test Architecture
/
🚀 Getting Started
Prerequisites

# Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard
Quick Start

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts
📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

ts
Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

"
Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

"
Validation Standards:

SSL/TLS: Strict certificate validation
Load balancers: Security group and listener validation
DNS: Route53 record validation
Network ACLs: Traffic flow validation
💻 Compute Domain
Purpose: EC2, ECS, and auto-scaling validation

"
Validation Standards:

ECS services: Resource limits and networking
Launch templates: Security and compliance
Auto-scaling: Scaling policies and health checks
🔄 Pipelines Domain
Purpose: CI/CD pipeline and deployment validation

"
Validation Standards:

CodePipeline: Stage and action validation
CodeBuild: Build environment security
Deployment: Rollback and monitoring capabilities
🔄 Integration Tests
📊 Comprehensive Validation
Purpose: Cross-domain validation and batch processing

"
Features:

Parameterized testing across rule categories
Batch validation for multiple templates
Performance benchmarking with timing
Development-friendly thresholds
🔐 Security Analysis
Purpose: Deep security analysis and health monitoring

"
Features:

Issue categorization by severity and type
Health scoring for project security
Deployment blocking analysis for CI/CD
Actionable recommendations for improvements
🎮 Running Tests
Basic Test Execution
ts
Test Filtering
verbose
Performance Testing
verbose
📝 Logging and Debugging
Log Levels

# DEBUG: Show all details including individual template results

LOG_LEVEL=debug yarn test

# INFO: Standard operational information (default)

LOG_LEVEL=info yarn test

# WARN: Warnings and errors only

LOG_LEVEL=warn yarn test

# ERROR: Errors only

LOG_LEVEL=error yarn test

Specialized Logging

# With custom prefix

PREFIX="CI-VALIDATION" LOG_LEVEL=debug yarn test

# Disable colors (for CI environments)

NO_COLOR=1 yarn test

# Enable timestamps

ENABLE_TIMESTAMPS=1 yarn test

# Disable test timing

DISABLE_TIMING=1 yarn test

Debug Specific Components

# Debug template discovery

LOG_LEVEL=debug yarn test tests/templates/core/template-discovery.test.ts

# Debug validation engine

LOG_LEVEL=debug yarn test tests/templates/core/validation-engine.test.ts

# Debug security analysis

LOG_LEVEL=debug yarn test tests/templates/security-analysis.test.ts

🔧 Development Workflow
Local Development

# 1. Run quick validation

yarn test tests/templates/core/ --verbose

# 2. Test your domain

yarn test tests/templates/domain/security.test.ts

# 3. Run comprehensive check

yarn test tests/templates/integration/comprehensive.test.ts

# 4. Final security analysis

yarn test tests/templates/security-analysis.test.ts

GitHub Copilot
Portfolio Infrastructure Testing Suite
A comprehensive CloudFormation template validation and security analysis framework for AWS infrastructure.

📋 Table of Contents
Overview
Test Architecture
Getting Started
Test Categories
Running Tests
Logging and Debugging
Development Workflow
CI/CD Integration
Troubleshooting
🎯 Overview
This testing suite provides comprehensive validation for CloudFormation templates across multiple domains including security, networking, compute, and CI/CD pipelines. It features:

🔒 Security-first validation with AWS Config Rules and cfn-guard
📊 Comprehensive logging with structured output and timing
🏗️ Domain-specific testing for different infrastructure components
⚡ Development-friendly with configurable thresholds
🔄 CI/CD ready with deployment blocking validation
🏗️ Test Architecture
/
🚀 Getting Started
Prerequisites

# Install dependencies

yarn install

# Ensure AWS CLI is configured

aws configure

# Install cfn-guard (if not already installed)

cargo install cfn-guard
Quick Start

# Run all tests

yarn test

# Run with debug logging

LOG_LEVEL=debug yarn test

# Run specific test suite

yarn test tests/templates/domain/security.test.ts
📂 Test Categories
🔍 Core Validation Tests
Purpose: Template discovery and validation engine testing

ts
Features:

Template file discovery across domains
Validation engine initialization
Rule loading and application
Error handling and recovery
🏛️ Domain-Specific Tests
🔒 Security Domain
Purpose: Security policy and compliance validation

"
Validation Standards:

Critical validation: Must pass for deployment
IAM policies: < 3 errors maximum
KMS/encryption: 0 errors (zero tolerance)
Security groups: < 2 errors maximum
🌐 Networking Domain
Purpose: Network infrastructure and connectivity validation

"
Validation Standards:

SSL/TLS: Strict certificate validation
Load balancers: Security group and listener validation
DNS: Route53 record validation
Network ACLs: Traffic flow validation
💻 Compute Domain
Purpose: EC2, ECS, and auto-scaling validation

"
Validation Standards:

ECS services: Resource limits and networking
Launch templates: Security and compliance
Auto-scaling: Scaling policies and health checks
🔄 Pipelines Domain
Purpose: CI/CD pipeline and deployment validation

"
Validation Standards:

CodePipeline: Stage and action validation
CodeBuild: Build environment security
Deployment: Rollback and monitoring capabilities
🔄 Integration Tests
📊 Comprehensive Validation
Purpose: Cross-domain validation and batch processing

"
Features:

Parameterized testing across rule categories
Batch validation for multiple templates
Performance benchmarking with timing
Development-friendly thresholds
🔐 Security Analysis
Purpose: Deep security analysis and health monitoring

"
Features:

Issue categorization by severity and type
Health scoring for project security
Deployment blocking analysis for CI/CD
Actionable recommendations for improvements
🎮 Running Tests
Basic Test Execution
ts
Test Filtering
verbose
Performance Testing
verbose
📝 Logging and Debugging
Log Levels
Specialized Logging

# With custom prefix

PREFIX="CI-VALIDATION" LOG_LEVEL=debug yarn test

# Disable colors (for CI environments)

NO_COLOR=1 yarn test

# Enable timestamps

ENABLE_TIMESTAMPS=1 yarn test

# Disable test timing

DISABLE_TIMING=1 yarn test
Debug Specific Components
ts
🔧 Development Workflow
Local Development
ts
Development-Friendly Settings
The test suite includes development-friendly thresholds:

// Security Domain (Development Mode)

- Critical errors: < 10 (instead of 0)
- IAM errors: < 3
- Encryption errors: < 3 (instead of 0)
- Success rate: > 1% (instead of 80%)

// Comprehensive Tests (Development Mode)

- Average errors: < 50 (instead of 10)
- Success rate: > 1% (instead of 20%)
- Error thresholds: 2-5x higher than production

Template Quality Gates

# Quality Gate 1: Individual template validation

yarn test tests/templates/domain/[domain].test.ts -t "Individual Template"

# Quality Gate 2: Critical security validation

yarn test tests/templates/domain/security.test.ts -t "CRITICAL"

# Quality Gate 3: Deployment readiness

yarn test tests/templates/security-analysis.test.ts -t "CRITICAL"

# Quality Gate 4: Cross-domain compatibility

yarn test tests/templates/integration/comprehensive.test.ts

❗ Troubleshooting
Common Issues

1. Template Discovery Failures

# Issue: No templates found

# Solution: Check template paths and permissions

LOG_LEVEL=debug yarn test tests/templates/core/template-discovery.test.ts

# Verify template directory structure

ls -la templates/\*/

2. Validation Engine Errors

# Issue: cfn-guard not found

# Solution: Install cfn-guard

cargo install cfn-guard

# Verify installation

cfn-guard --version

3. Watchman Issues (macOS)

# Stop watchman

watchman shutdown-server

# Give full disk access to your terminal

# Go to: System Preferences > Security & Privacy > Privacy > Full Disk Access

# Add your terminal app (Terminal.app or iTerm)

# Restart watchman

watchman watch-del-all
watchman watch-project /path/to/your/project

4. High Memory Usage

# Issue: Tests consuming too much memory

# Solution: Limit concurrent tests

yarn test --maxWorkers=1

# Or limit template analysis

MAX_TEMPLATES=5 yarn test

5. Timeout Issues

# Issue: Tests timing out

# Solution: Increase timeout

TIMEOUT=60000 yarn test

# Or run with fewer templates

yarn test tests/templates/domain/security.test.ts -t "Individual Template"

Debug Commands

# Debug template discovery

LOG_LEVEL=debug yarn test tests/templates/core/template-discovery.test.ts

# Debug validation process

LOG_LEVEL=debug yarn test tests/templates/core/validation-engine.test.ts

# Debug specific template

LOG_LEVEL=debug yarn test tests/templates/domain/security.test.ts -t "kms.yml"

# Check system resources

yarn test --verbose --detectOpenHandles

# Clear Jest cache

yarn test --clearCache

Performance Optimization

# Run tests in parallel (default)

yarn test --maxWorkers=auto

# Run tests serially (for debugging)

yarn test --runInBand

# Disable coverage for faster execution

yarn test --no-coverage

# Use development mode for faster validation

NODE_ENV=development yarn test

🔧 Configuration
Environment Variables

# Logging configuration

LOG_LEVEL=debug # debug, info, warn, error
ENABLE_TIMESTAMPS=true # Add timestamps to logs
ENABLE_COLORS=true # Colorize output
PREFIX="CUSTOM" # Custom log prefix

# Test configuration

NODE_ENV=development # Enable development mode
MAX_TEMPLATES=10 # Limit template analysis
TIMEOUT=30000 # Test timeout in milliseconds

# Validation configuration

STRICT_MODE=false # Enable strict validation
FAIL_FAST=false # Stop on first failure
DETAILED_ERRORS=true # Show detailed error information

Best Practices
Test Organization
Start with core tests - Ensure template discovery works
Run domain-specific tests - Validate individual areas
Execute integration tests - Check cross-domain compatibility
Perform security analysis - Final deployment readiness
Development Workflow
Use development-friendly thresholds during active development
Focus on critical issues that block deployment
Gradually tighten standards as templates mature
Use debug logging for troubleshooting specific issues
CI/CD Integration
Run critical tests on every commit
Execute comprehensive validation on pull requests
Perform security analysis before deployment
Monitor health metrics in production
