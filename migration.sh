#!/bin/bash
set -e

echo "🏗️  Migrating to production-ready structure..."

# Create new directory
mkdir -p portfolio-infrastructure

# Create directory structure
mkdir -p portfolio-infrastructure/{.vscode,docs/{architecture-diagrams},config/{environments,services},templates/{core,compute,networking,security,storage,pipelines},scripts/{setup,deployment,validation,maintenance},tests/{unit,integration,security/{guard-rules,policies}},tools}

# Copy and reorganize files
echo "📁 Reorganizing files..."#!/bin/bash
set -e

echo "🏗️  Renaming and reorganizing to production-ready structure..."

# Step 1: Rename the main directory
echo "📁 Renaming main directory..."
cd ..
mv my-portfolio-infra portfolio-infrastructure
cd portfolio-infrastructure

# Step 2: Create any missing directories
echo "📂 Creating missing directories..."
mkdir -p .vscode docs/{architecture-diagrams} config/{environments,services} tests/{unit,integration,security/{guard-rules,policies}} tools

# Step 3: Reorganize existing files
echo "🔀 Reorganizing files..."

# Move rain.yaml to tools
mv rain.yaml tools/rain.yml

# Reorganize infra directory to templates
mv infra templates

# Within templates, reorganize into logical groups
mkdir -p templates/{core,compute,networking,security,storage,pipelines}

# Core infrastructure
mv templates/VPC.yml templates/core/vpc.yml
mv templates/ECSCluster.yml templates/compute/ecs-cluster.yml
mv templates/AutoScalingGroup.yml templates/compute/auto-scaling-group.yml
mv templates/LaunchTemplate.yml templates/compute/launch-template.yml

# Networking
mv templates/DynamicLoadBalancer.yml templates/networking/application-load-balancer.yml
mv templates/LoadBalancer.yml templates/networking/network-load-balancer.yml
mv templates/dns.yml templates/networking/dns-records.yml
mv templates/certificate.yml templates/networking/ssl-certificate.yml

# Services (keep in compute since they're ECS services)
mv templates/services/DynamicService.yml templates/compute/ecs-service.yml
mv templates/services/ProjectFullStackService.yml templates/compute/project-fullstack-service.yml

# Pipelines
mv templates/pipelines/DynamicPipeline.yml templates/pipelines/ci-cd-pipeline.yml
mv templates/pipelines/Project3Pipeline.yml templates/pipelines/project-pipeline.yml

# Security/IAM
mv templates/iam/CodeBuildPolicies.yml templates/security/codebuild-policies.yml
mv templates/iam/CodePipelinePolicies.yml templates/security/codepipeline-policies.yml

# Main template
mv templates/MasterNestedStack.yml templates/main.yml

# Clean up empty directories
rmdir templates/services templates/iam templates/pipelines 2>/dev/null || true

# Step 4: Reorganize scripts
echo "🔧 Reorganizing scripts..."
mkdir -p scripts/{setup,deployment,validation,maintenance}

# Move validation scripts
mv scripts/validate-templates.sh scripts/validation/
mv scripts/validate-with-rain.sh scripts/validation/

# Move deployment scripts
mv scripts/deploy.sh scripts/deployment/deploy-infrastructure.sh
mv scripts/deploy-certificate.sh scripts/deployment/
mv scripts/deploy-dns.sh scripts/deployment/
mv scripts/deploy-with-rain.sh scripts/deployment/

# Move maintenance scripts
mv scripts/update.sh scripts/maintenance/update-stacks.sh

# Step 5: Move security validation
echo "🛡️  Reorganizing security files..."
mv cfn-guard/policies/validate-security.sh scripts/validation/validate-security.sh
rmdir cfn-guard/policies cfn-guard 2>/dev/null || true

# Step 6: Reorganize documentation
echo "📚 Reorganizing documentation..."
mv REFERENCE.md docs/deployment-guide.md

# Step 7: Create missing essential files
echo "📝 Creating configuration templates..."

# Environment configuration template
cat > config/environments/dev.yml << 'EOF'
# Development environment configuration
environment: dev
region: eu-west-1

# Infrastructure sizing
ecs:
  instance_type: t3.micro
  min_size: 1
  max_size: 3
  desired_capacity: 1

# Networking
vpc:
  cidr: "10.0.0.0/16"

# Domains (update with your actual domains)
domains:
  root: "yourdomain.com"
  www: "www.yourdomain.com"
  api: "api.yourdomain.com"
EOF

# VS Code settings
cat > .vscode/settings.json << 'EOF'
{
  "[makefile]": {
    "editor.insertSpaces": false,
    "editor.detectIndentation": false,
    "editor.tabSize": 4
  },
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.insertSpaces": true,
    "editor.tabSize": 2
  },
  "yaml.schemas": {
    "https://raw.githubusercontent.com/aws-cloudformation/cfn-lint/main/src/cfnlint/data/schemas/providers/us_east_1/aws.json": "templates/**/*.yml"
  }
}
EOF

# .gitignore
cat > .gitignore << 'EOF'
# Environment files
.env

# AWS credentials
.aws/

# IDE files
.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Rain cache
.rain/

# Reports
reports/

# Temporary files
tmp/
temp/
*.tmp

# Build artifacts
build/
dist/
node_modules/
EOF

# Environment template
cp .env .env.example
echo "" >> .env.example
echo "# Copy this file to .env and update with your values" >> .env.example

echo "✅ Migration completed!"
echo ""
echo "📂 New structure:"
echo "portfolio-infrastructure/"
echo "├── templates/           # CloudFormation templates (renamed from infra/)"
echo "│   ├── main.yml        # Main stack (renamed from MasterNestedStack.yml)"
echo "│   ├── core/           # VPC, security groups"
echo "│   ├── compute/        # ECS, Auto Scaling, services"
echo "│   ├── networking/     # Load balancers, DNS, certificates"
echo "│   └── security/       # IAM roles and policies"
echo "├── scripts/            # Organized deployment scripts"
echo "├── config/             # Environment configurations"
echo "├── docs/               # Documentation"
echo "└── tools/              # Development tools"
echo ""
echo "🚀 Next steps:"
echo "   1. Update template references in templates/main.yml"
echo "   2. Update Makefile with new paths"
echo "   3. Update GitHub Actions workflows"
echo "   4. Test with: make validate"

# GitHub workflows
cp -r .github portfolio-infrastructure/

# Core infrastructure
cp infra/VPC.yml portfolio-infrastructure/templates/core/vpc.yml
cp infra/ECSCluster.yml portfolio-infrastructure/templates/compute/ecs-cluster.yml
cp infra/AutoScalingGroup.yml portfolio-infrastructure/templates/compute/auto-scaling-group.yml
cp infra/LaunchTemplate.yml portfolio-infrastructure/templates/compute/launch-template.yml

# Networking
cp infra/DynamicLoadBalancer.yml portfolio-infrastructure/templates/networking/application-load-balancer.yml
cp infra/LoadBalancer.yml portfolio-infrastructure/templates/networking/network-load-balancer.yml
cp infra/dns.yml portfolio-infrastructure/templates/networking/dns-records.yml
cp infra/certificate.yml portfolio-infrastructure/templates/networking/ssl-certificate.yml

# Services and pipelines
cp infra/services/DynamicService.yml portfolio-infrastructure/templates/compute/ecs-service.yml
cp infra/services/ProjectFullStackService.yml portfolio-infrastructure/templates/pipelines/portfolio-pipeline.yml
cp infra/pipelines/DynamicPipeline.yml portfolio-infrastructure/templates/pipelines/ci-cd-pipeline.yml
cp infra/pipelines/Project3Pipeline.yml portfolio-infrastructure/templates/pipelines/project-pipelines.yml

# Security
cp infra/iam/CodeBuildPolicies.yml portfolio-infrastructure/templates/security/codebuild-policies.yml
cp infra/iam/CodePipelinePolicies.yml portfolio-infrastructure/templates/security/codepipeline-policies.yml

# Main template
cp infra/MasterNestedStack.yml portfolio-infrastructure/templates/main.yml

# Scripts
cp -r scripts/* portfolio-infrastructure/scripts/deployment/

# Configuration files
cp .env portfolio-infrastructure/
cp rain.yaml portfolio-infrastructure/tools/rain.yml
cp imagedefinitions.json portfolio-infrastructure/
cp Makefile portfolio-infrastructure/
cp README.md portfolio-infrastructure/
cp REFERENCE.md portfolio-infrastructure/docs/deployment-guide.md

# Security validation
cp -r cfn-guard/policies/* portfolio-infrastructure/tests/security/policies/

echo "✅ Migration completed!"
echo "📂 New structure created in: portfolio-infrastructure/"
echo "🚀 Next steps:"
echo "   1. Review and update template references in main.yml"
echo "   2. Update Makefile paths"
echo "   3. Test deployment with: cd portfolio-infrastructure && make validate"