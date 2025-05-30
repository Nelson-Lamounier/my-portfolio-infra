#!/bin/bash
set -e

echo "🏗️  Migrating to production-ready structure..."

# Create new directory
mkdir -p portfolio-infrastructure

# Create directory structure
mkdir -p portfolio-infrastructure/{.vscode,docs/{architecture-diagrams},config/{environments,services},templates/{core,compute,networking,security,storage,pipelines},scripts/{setup,deployment,validation,maintenance},tests/{unit,integration,security/{guard-rules,policies}},tools}

# Copy and reorganize files
echo "📁 Reorganizing files..."

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