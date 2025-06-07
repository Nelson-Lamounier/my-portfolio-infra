# CFN Guard Rules for Portfolio Infrastructure

This directory contains simplified CloudFormation Guard rules optimized for personal portfolio projects.

## 📁 File Structure

### `baseline.guard`

**Purpose**: Core security fundamentals and best practices
**Services**: S3, KMS, CloudWatch Logs, CodeBuild, CodePipeline
**Key Rules**:

- S3 bucket security (versioning, public access blocking)
- KMS key rotation and secure policies
- CloudWatch log retention
- Cost optimization (instance types, monitoring)
- Basic CI/CD security

### `compute.guard`

**Purpose**: Container and compute security
**Services**: ECS (Clusters, Services, Tasks), EC2, Auto Scaling Groups, Launch Templates
**Key Rules**:

- ECS container security (no privileged mode, logging, user security)
- ECS deployment configuration (circuit breakers, network security)
- Launch template security (IMDSv2, encryption, key pairs)
- Auto Scaling health checks and configuration

### `networking.guard`

**Purpose**: Network infrastructure and connectivity
**Services**: ALB, Target Groups, Security Groups, Route53, ACM Certificates
**Key Rules**:

- Security group ingress/egress validation
- Load balancer security and SSL/TLS configuration
- HTTPS enforcement and redirects
- Target group health check configuration
- SSL certificate DNS validation
- Route53 alias record preferences

### `iam.guard`

**Purpose**: Identity and access management
**Services**: IAM Roles, Policies, Instance Profiles
**Key Rules**:

- Role security (no admin access, specific principals)
- Service-specific role validation (ECS, CodeBuild, CodePipeline)
- Least privilege policy enforcement
- PassRole restrictions
- Managed policy preferences

## 🎯 Usage

### Run All Rules

```bash
cfn-guard validate --rules rules/ --data templates/

Run Specific Category

cfn-guard validate --rules rules/baseline.guard --data templates/
cfn-guard validate --rules rules/compute.guard --data templates/

yarn test tests/templates/domain/security.test.ts
```

🔧 Customization
Development vs Production
Rules include environment-aware logic:

More relaxed security for development environments
Cost optimization for portfolio projects
Stricter requirements for production resources
Portfolio-Focused Features
Cost-effective instance type validation
Reasonable volume sizes and retention periods
Development-friendly public IP allowances
Simplified tagging requirements

Portfolio-Focused Features
Cost-effective instance type validation
Reasonable volume sizes and retention periods
Development-friendly public IP allowances
Simplified tagging requirements

Rule Categories
Category Focus Strictness Portfolio Optimized
Baseline Core Security High ✅
Compute Containers/EC2 Medium ✅
Networking ALB/SSL/DNS High ✅
IAM Access Control High ✅

Integration
These rules integrate with your existing test suite:

Domain-specific validation tests
Security analysis framework
CI/CD pipeline validation
Deployment readiness checks

Migration Steps

1. Backup Current Structure

# Remove old structure

rm -rf cfn-guard/rules/\*

# Create new files

touch cfn-guard/rules/baseline.guard
touch cfn-guard/rules/compute.guard  
touch cfn-guard/rules/networking.guard
touch cfn-guard/rules/iam.guard
touch cfn-guard/rules/README.md

4. Update Tests

# Update test configuration

yarn test tests/templates/domain/security.test.ts --verbose

5. Verify

# Test the new structure

cfn-guard validate --rules cfn-guard/rules/ --data templates/

Benefits of This Simplification
🎯 Portfolio-Focused: Removes enterprise overhead
🔧 Maintainable: 4 files instead of 20+
📚 Educational: Clear categorization and documentation
⚡ Practical: Focus on services you actually use
💰 Cost-Conscious: Built-in cost optimization
🚀 Testable: Works with your existing test framework
This simplified structure maintains comprehensive security while being much more manageable for a solo developer portfolio project!
