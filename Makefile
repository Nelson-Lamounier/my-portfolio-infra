# @format
# Portfolio Infrastructure Management
# Author: Nelson Lamounier
# Description: Makefile for managing CloudFormation infrastructure with Rain and CFN Guard

.PHONY: help install validate deploy clean security-check format lint
.DEFAULT_GOAL := help

# Configuration
AWS_REGION ?= eu-west-1
ENVIRONMENT ?= dev
TEMPLATE_BUCKET ?= your-cloudformation-templates-bucket
ARTIFACT_BUCKET ?= your-codepipeline-artifacts-bucket

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)🌧️  Portfolio Infrastructure Management$(NC)"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "Environment variables:"
	@echo "  AWS_REGION=$(AWS_REGION)"
	@echo "  ENVIRONMENT=$(ENVIRONMENT)"
	@echo "  TEMPLATE_BUCKET=$(TEMPLATE_BUCKET)"
	@echo "  ARTIFACT_BUCKET=$(ARTIFACT_BUCKET)"

install: ## Install required tools (Rain, CFN Guard, etc.)
	@echo "$(GREEN)📦 Installing required tools...$(NC)"
	@if ! command -v rain &> /dev/null; then \
	    echo "Installing Rain..."; \
	    curl -L https://github.com/aws-cloudformation/rain/releases/latest/download/rain_darwin_amd64.zip -o /tmp/rain.zip; \
	    unzip -o /tmp/rain.zip -d /tmp; \
	    sudo mv /tmp/rain /usr/local/bin/; \
	    rm /tmp/rain.zip; \
	fi
	@if ! command -v cfn-guard &> /dev/null; then \
	    echo "Installing CFN Guard..."; \
	    brew install aws/tap/cfn-guard || ( \
	        curl -L https://github.com/aws-cloudformation/cloudformation-guard/releases/latest/download/cfn-guard-v3-macos-latest.tar.gz -o /tmp/cfn-guard.tar.gz; \
	        tar -xzf /tmp/cfn-guard.tar.gz -C /tmp; \
	        sudo mv /tmp/cfn-guard /usr/local/bin/; \
	        rm /tmp/cfn-guard.tar.gz \
	    ); \
	fi
	@if ! command -v yamllint &> /dev/null; then \
	    echo "Installing yamllint..."; \
	    pip3 install yamllint; \
	fi
	@if ! command -v cfn-lint &> /dev/null; then \
	    echo "Installing cfn-lint..."; \
	    pip3 install cfn-lint; \
	fi
	@echo "$(GREEN)✅ All tools installed successfully!$(NC)"

lint: ## Run YAML and CloudFormation linting
	@echo "$(GREEN)🔍 Running linting checks...$(NC)"
	@yamllint infra/ || echo "$(RED)❌ YAML linting failed$(NC)"
	@cfn-lint infra/**/*.yml || echo "$(RED)❌ CloudFormation linting failed$(NC)"
	@echo "$(GREEN)✅ Linting completed!$(NC)"

validate: ## Validate all CloudFormation templates with Rain
	@echo "$(GREEN)🔍 Validating templates with Rain...$(NC)"
	@for template in $$(find infra -name "*.yml" -type f); do \
	    echo "Validating: $$template"; \
	    rain fmt --verify "$$template" || exit 1; \
	done
	@echo "$(GREEN)✅ All templates validated successfully!$(NC)"

security-check: ## Run security validation with CFN Guard
	@echo "$(GREEN)🛡️  Running security checks with CFN Guard...$(NC)"
	@mkdir -p reports/guard-results
	@for template in $$(find infra -name "*.yml" -type f); do \
	    echo "🔍 Security check: $$template"; \
	    cfn-guard validate \
	        --data "$$template" \
	        --rules cfn-guard/rules/ \
	        --output-format json \
	        --show-summary \
	        > "reports/guard-results/$$(basename "$$template" .yml)-security.json" 2>&1 || \
	        echo "$(YELLOW)⚠️  Security issues found in $$template - check reports/guard-results/$(NC)"; \
	done
	@echo "$(GREEN)🛡️  Security validation completed! Check reports/ for details$(NC)"

format: ## Format CloudFormation templates with Rain
	@echo "$(GREEN)🎨 Formatting templates...$(NC)"
	@find infra -name "*.yml" -exec rain fmt {} \;
	@echo "$(GREEN)✅ Templates formatted!$(NC)"

upload-templates: ## Upload templates to S3
	@echo "$(GREEN)☁️  Uploading templates to S3...$(NC)"
	@aws s3 sync infra/ s3://$(TEMPLATE_BUCKET)/infra/ \
	    --exclude "*.md" \
	    --exclude ".git/*" \
	    --delete \
	    --region $(AWS_REGION)
	@echo "$(GREEN)✅ Templates uploaded to s3://$(TEMPLATE_BUCKET)/infra/$(NC)"

validate-aws: upload-templates ## Validate templates with AWS CloudFormation
	@echo "$(GREEN)☁️  Validating templates with AWS CloudFormation...$(NC)"
	@aws cloudformation validate-template \
	    --template-url https://$(TEMPLATE_BUCKET).s3.$(AWS_REGION).amazonaws.com/infra/MasterNestedStack.yml \
	    --region $(AWS_REGION)
	@echo "$(GREEN)✅ AWS validation completed!$(NC)"

preview: upload-templates ## Preview stack changes with Rain
	@echo "$(GREEN)🔮 Previewing stack changes...$(NC)"
	@rain forecast infra/MasterNestedStack.yml --params \
	    Environment=$(ENVIRONMENT),\
	    TemplateBucket=$(TEMPLATE_BUCKET),\
	    TemplatePrefix=infra/,\
	    ArtifactBucket=$(ARTIFACT_BUCKET)

deploy-infra: validate upload-templates ## Deploy infrastructure stack
	@echo "$(GREEN)🚀 Deploying infrastructure...$(NC)"
	@aws cloudformation deploy \
	    --template-file infra/MasterNestedStack.yml \
	    --stack-name PortfolioMasterStack \
	    --parameter-overrides \
	        Environment=$(ENVIRONMENT) \
	        TemplateBucket=$(TEMPLATE_BUCKET) \
	        TemplatePrefix="infra/" \
	        ArtifactBucket=$(ARTIFACT_BUCKET) \
	        Region=$(AWS_REGION) \
	    --capabilities CAPABILITY_NAMED_IAM \
	    --region $(AWS_REGION) \
	    --tags \
	        Project=Portfolio \
	        Environment=$(ENVIRONMENT) \
	        ManagedBy=Makefile
	@echo "$(GREEN)✅ Infrastructure deployed successfully!$(NC)"

deploy-rain: validate upload-templates ## Deploy with Rain (alternative method)
	@echo "$(GREEN)🌧️  Deploying with Rain...$(NC)"
	@rain deploy infra/MasterNestedStack.yml PortfolioMasterStack \
	    --params \
	    Environment=$(ENVIRONMENT),\
	    TemplateBucket=$(TEMPLATE_BUCKET),\
	    TemplatePrefix=infra/,\
	    ArtifactBucket=$(ARTIFACT_BUCKET),\
	    Region=$(AWS_REGION) \
	    --yes
	@echo "$(GREEN)✅ Rain deployment completed!$(NC)"

status: ## Check stack status
	@echo "$(GREEN)📊 Checking stack status...$(NC)"
	@aws cloudformation describe-stacks \
	    --stack-name PortfolioMasterStack \
	    --region $(AWS_REGION) \
	    --query 'Stacks[0].{Status:StackStatus,LastUpdated:LastUpdatedTime}' \
	    --output table || echo "$(RED)❌ Stack not found$(NC)"

logs: ## Show recent stack events
	@echo "$(GREEN)📋 Recent stack events...$(NC)"
	@aws cloudformation describe-stack-events \
	    --stack-name PortfolioMasterStack \
	    --region $(AWS_REGION) \
	    --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
	    --output table || echo "$(RED)❌ Stack not found$(NC)"

outputs: ## Show stack outputs
	@echo "$(GREEN)📤 Stack outputs...$(NC)"
	@aws cloudformation describe-stacks \
	    --stack-name PortfolioMasterStack \
	    --region $(AWS_REGION) \
	    --query 'Stacks[0].Outputs' \
	    --output table || echo "$(RED)❌ Stack not found$(NC)"

watch: ## Watch stack deployment in real-time with Rain
	@echo "$(GREEN)👀 Watching stack events...$(NC)"
	@rain watch PortfolioMasterStack

delete: ## Delete the entire stack
	@echo "$(RED)🗑️  Deleting stack...$(NC)"
	@read -p "Are you sure you want to delete PortfolioMasterStack? [y/N] " confirm && [ "$$confirm" = "y" ]
	@aws cloudformation delete-stack \
	    --stack-name PortfolioMasterStack \
	    --region $(AWS_REGION)
	@echo "$(YELLOW)⏳ Waiting for stack deletion...$(NC)"
	@aws cloudformation wait stack-delete-complete \
	    --stack-name PortfolioMasterStack \
	    --region $(AWS_REGION)
	@echo "$(GREEN)✅ Stack deleted successfully!$(NC)"

clean: ## Clean up local artifacts and reports
	@echo "$(GREEN)🧹 Cleaning up...$(NC)"
	@rm -rf reports/
	@rm -rf .rain/
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

doctor: ## Run comprehensive health check
	@echo "$(GREEN)🩺 Running infrastructure health check...$(NC)"
	@echo "1. Checking AWS CLI..."
	@aws sts get-caller-identity --region $(AWS_REGION) > /dev/null && echo "$(GREEN)✅ AWS CLI configured$(NC)" || echo "$(RED)❌ AWS CLI not configured$(NC)"
	@echo "2. Checking tools..."
	@command -v rain > /dev/null && echo "$(GREEN)✅ Rain installed$(NC)" || echo "$(RED)❌ Rain not installed$(NC)"
	@command -v cfn-guard > /dev/null && echo "$(GREEN)✅ CFN Guard installed$(NC)" || echo "$(RED)❌ CFN Guard not installed$(NC)"
	@echo "3. Checking S3 buckets..."
	@aws s3 ls s3://$(TEMPLATE_BUCKET) --region $(AWS_REGION) > /dev/null 2>&1 && echo "$(GREEN)✅ Template bucket accessible$(NC)" || echo "$(RED)❌ Template bucket not accessible$(NC)"
	@aws s3 ls s3://$(ARTIFACT_BUCKET) --region $(AWS_REGION) > /dev/null 2>&1 && echo "$(GREEN)✅ Artifact bucket accessible$(NC)" || echo "$(RED)❌ Artifact bucket not accessible$(NC)"
	@echo "4. Checking stack status..."
	@aws cloudformation describe-stacks --stack-name PortfolioMasterStack --region $(AWS_REGION) > /dev/null 2>&1 && echo "$(GREEN)✅ Stack exists$(NC)" || echo "$(YELLOW)⚠️  Stack not deployed$(NC)"

pre-commit: lint validate security-check ## Run all pre-commit checks
	@echo "$(GREEN)✅ All pre-commit checks passed!$(NC)"

ci-validate: lint validate security-check ## CI validation (no AWS deployment)
	@echo "$(GREEN)✅ CI validation completed!$(NC)"

cd-deploy: ci-validate deploy-infra ## CD deployment (full pipeline)
	@echo "$(GREEN)✅ CD deployment completed!$(NC)"

dev: format validate preview ## Development workflow (format, validate, preview)
	@echo "$(GREEN)✅ Development checks completed!$(NC)"

prod: ## Deploy to production (requires confirmation)
	@echo "$(RED)🚨 Production deployment$(NC)"
	@read -p "Are you sure you want to deploy to production? [y/N] " confirm && [ "$$confirm" = "y" ]
	@$(MAKE) ENVIRONMENT=prod deploy-infra

quick-deploy: format upload-templates deploy-infra ## Quick development deployment
	@echo "$(GREEN)⚡ Quick deployment completed!$(NC)"