<!-- @format -->

# Portfolio Infrastructure - Project Structure

> **Last Updated**: January 2025  
> **Version**: 1.0  
> **Project**: Multi-Environment AWS Infrastructure

## Overview

This document describes the organization and purpose of each directory and file in the portfolio infrastructure project.

## Directory Structure

```
portfolio-infrastructure/
├── 📄 Makefile                     # Build automation and deployment commands
├── 📄 README.md                    # Project overview and quick start
├── 📄 imagedefinitions.json        # Container image definitions for CI/CD
├── 📄 migration.sh                 # Legacy migration script
│
├── 📁 cfn-guard/                   # CloudFormation security and compliance rules
│   └── rules/
│       ├── compliance.guard        # Compliance validation rules
│       ├── compute-security.guard  # EC2/ECS security rules
│       ├── cost-optimisation.guard # Cost optimization checks
│       ├── networking-security.guard # Network security rules
│       └── security-baseline.guard # Base security requirements
│
├── 📁 config/                      # Environment and service configurations
│   ├── environments/              # Environment-specific settings
│   │   ├── dev.yml                # Development environment config
│   │   └── prod.yml               # Production environment config
│   └── services/                  # Service-specific configurations (future)
│
├── 📁 docs/                       # Project documentation
│   ├── deployment-guide.md        # Step-by-step deployment instructions
│   ├── project-structure.md       # This file
│   ├── debug-guide.md             # Troubleshooting and debugging
│   └── {architecture-diagrams}/   # AWS architecture diagrams
│
├── 📁 parameters/                 # CloudFormation parameter files
│   └── dev.yml                   # Generated CF parameters for dev
│
├── 📁 scripts/                   # Automation and utility scripts
│   ├── deployment/               # Deployment automation
│   │   ├── deploy-infrastructure.sh # Main infrastructure deployment
│   │   ├── deploy-parameter.sh    # Parameter file deployment
│   │   └── deploy-with-rain.sh    # Rain CLI deployment wrapper
│   ├── maintenance/              # Operational maintenance
│   │   └── update-stacks.sh      # Stack update automation
│   ├── setup/                    # Initial setup scripts (future)
│   └── validation/               # Template and security validation
│       ├── validate-security.sh   # Security compliance checks
│       ├── validate-templates.sh  # CloudFormation template validation
│       └── validate-with-rain.sh  # Rain-based validation
│
├── 📁 templates/                 # CloudFormation templates
│   ├── 📄 main.yml               # Master template orchestrating all stacks
│   ├── compute/                  # Compute resources (ECS, EC2)
│   │   ├── auto-scaling-group.yml # EC2 Auto Scaling configuration
│   │   ├── ecs-cluster.yml       # ECS cluster definition
│   │   ├── ecs-service.yml       # ECS service and task definitions
│   │   └── launch-template.yml   # EC2 launch template for ECS
│   ├── core/                     # Foundation infrastructure
│   │   └── vpc.yml               # VPC, subnets, routing, gateways
│   ├── networking/               # Network and load balancing
│   │   ├── application-load-balancer.yml # ALB configuration
│   │   ├── dns-records.yml       # Route 53 DNS records
│   │   ├── network-load-balancer.yml # NLB (if needed)
│   │   └── ssl-certificate.yml   # SSL/TLS certificates
│   ├── pipelines/                # CI/CD infrastructure
│   │   └── ci-cd-pipeline.yml    # CodePipeline and CodeBuild
│   ├── security/                 # IAM roles, policies, security groups
│   │   ├── codebuild-policies.yml # CodeBuild IAM policies
│   │   ├── codepipeline-policies.yml # CodePipeline IAM policies
│   │   ├── ecs-policies.yml      # ECS IAM roles and policies
│   │   └── ecs-security-groups.yml # ECS security groups
│   ├── stacks/                   # Nested stack components (future)
│   ├── storage/                  # Storage resources (future)
│   └── templates/                # Template fragments (future)
│
├── 📁 tests/                     # Testing and validation
│   ├── integration/              # Integration tests (future)
│   ├── security/                 # Security testing
│   │   ├── guard-rules/          # Custom CloudFormation Guard rules
│   │   └── policies/             # IAM policy validation
│   └── unit/                     # Unit tests for templates (future)
│
└── 📁 tools/                     # Development tools configuration
    └── rain.yml                  # Rain CLI configuration
```

## Key Files and Their Purpose

### Root Level Files

| File                    | Purpose                               | When to Modify             |
| ----------------------- | ------------------------------------- | -------------------------- |
| `Makefile`              | Build automation, deployment commands | Add new deployment targets |
| `README.md`             | Project overview, quick start guide   | Update setup instructions  |
| `imagedefinitions.json` | Container deployment definitions      | Update container versions  |
| `migration.sh`          | Legacy migration utilities            | Historical migrations only |

### Configuration Files

#### Environment Configurations (`config/environments/`)

- **Purpose**: Environment-specific settings (instance types, scaling, domains)
- **Format**: YAML configuration files
- **Usage**: Source of truth for environment differences

```yaml
# Example: config/environments/dev.yml
environment: dev
region: eu-west-1
ecs:
  instance_type: t3.large
  min_size: 1
  max_size: 1
vpc:
  cidr: "10.0.0.0/16"
domains:
  root: "lamounierdigital.com"
```

#### CloudFormation Parameters (`parameters/`)

- **Purpose**: Generated CloudFormation deployment parameters
- **Source**: Auto-generated from `config/environments/`
- **Usage**: Direct input to CloudFormation deployments

### Infrastructure Templates (`templates/`)

#### Master Template

- **`main.yml`**: Orchestrates all nested stacks with proper dependencies

#### Template Categories

| Category      | Purpose                   | Contains                                     |
| ------------- | ------------------------- | -------------------------------------------- |
| `core/`       | Foundation infrastructure | VPC, subnets, gateways                       |
| `compute/`    | Processing resources      | ECS clusters, Auto Scaling, Launch Templates |
| `networking/` | Network services          | Load balancers, DNS, SSL certificates        |
| `security/`   | Access control            | IAM roles, policies, security groups         |
| `pipelines/`  | CI/CD infrastructure      | CodePipeline, CodeBuild                      |

### Security and Compliance (`cfn-guard/`)

#### Guard Rules

- **Purpose**: Automated security and compliance validation
- **Usage**: Run before deployment to catch policy violations
- **Categories**:
  - **Security Baseline**: Fundamental security requirements
  - **Compliance**: Regulatory compliance checks
  - **Cost Optimization**: Resource efficiency validation
  - **Network Security**: Network access controls

### Scripts and Automation (`scripts/`)

#### Deployment Scripts (`scripts/deployment/`)

```bash
# Main deployment workflow
./scripts/deployment/deploy-infrastructure.sh dev

# Parameter-only deployment
./scripts/deployment/deploy-parameter.sh dev

# Rain CLI deployment
./scripts/deployment/deploy-with-rain.sh dev
```

#### Validation Scripts (`scripts/validation/`)

```bash
# Validate all templates
./scripts/validation/validate-templates.sh

# Security validation
./scripts/validation/validate-security.sh

# Rain-based validation
./scripts/validation/validate-with-rain.sh
```

## Environment Strategy

### Development Environment

- **Purpose**: Feature development and testing
- **Characteristics**: Cost-optimized, single instance, relaxed security
- **Configuration**: `config/environments/dev.yml`

### Production Environment

- **Purpose**: Live application serving
- **Characteristics**: High availability, multi-instance, strict security
- **Configuration**: `config/environments/prod.yml`

## Workflow Overview

### 1. Configuration-Driven Deployment

```bash
# 1. Modify environment config
vim config/environments/dev.yml

# 2. Generate CloudFormation parameters
make config-to-params ENV=dev

# 3. Deploy infrastructure
make deploy ENV=dev
```

### 2. Validation and Security

```bash
# Validate templates before deployment
make validate

# Run security checks
make security-check

# Check compliance
make compliance-check
```

### 3. Monitoring and Debugging

```bash
# Check deployment status
make status ENV=dev

# View logs
make logs ENV=dev

# Debug issues
# See: docs/debug-guide.md
```

## Best Practices

### Directory Organization

- ✅ **Logical grouping**: Related resources in same directory
- ✅ **Environment separation**: Config-driven environment differences
- ✅ **Security focus**: Dedicated security templates and validation
- ✅ **Documentation**: Comprehensive docs for maintenance

### File Naming Conventions

- ✅ **Descriptive names**: Clear purpose from filename
- ✅ **Consistent patterns**: Same naming across environments
- ✅ **Hyphen separation**: `auto-scaling-group.yml` not `AutoScalingGroup.yml`

### Template Organization

- ✅ **Single responsibility**: Each template has one clear purpose
- ✅ **Proper dependencies**: Clear dependency chain in main.yml
- ✅ **Environment awareness**: All templates support Environment parameter

## Future Enhancements

### Planned Additions

- 📋 **Integration Tests**: Automated deployment testing
- 📋 **Unit Tests**: Template logic validation
- 📋 **Service Configs**: Service-specific configuration management
- 📋 **Setup Scripts**: Automated initial setup
- 📋 **Storage Templates**: RDS, ElastiCache, S3 resources

### Scalability Considerations

- **Multi-region**: Template structure supports multi-region deployment
- **Multi-project**: Directory structure can accommodate multiple projects
- **Team collaboration**: Clear separation of concerns for team development

## Related Documentation

- 📖 [Deployment Guide](deployment-guide.md) - Step-by-step deployment
- 🐛 [Debug Guide](debug-guide.md) - Troubleshooting and debugging
- 🏗️ [Architecture Diagrams](architecture-diagrams/) - Visual infrastructure overview

## Maintenance

This document should be updated when:

- ✅ New directories or files are added
- ✅ Project structure changes
- ✅ New workflows are introduced
- ✅ Tool configurations change

```

```
