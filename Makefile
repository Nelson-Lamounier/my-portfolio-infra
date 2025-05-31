.PHONY: validate lint deploy-dry deploy clean test-all pre-check syntax-check upload-templates

# Load environment variables
include .env
export

# === VALIDATION AND TESTING ===

# CloudFormation syntax check with parameter handling
syntax-check:
	   @echo "🔍 Checking CloudFormation template syntax..."
	   @# Check main template first (it has all parameters)
	   @echo "Validating main template..."
	   @aws cloudformation validate-template \
	       --template-body file://templates/main.yml \
	       --region $(REGION) > /dev/null || exit 1
	   @# Check individual templates that don't depend on main stack parameters
	   @for template in templates/core/*.yml templates/security/*.yml; do \
	       if [ -f "$$template" ]; then \
	           echo "Validating $$template..."; \
	           aws cloudformation validate-template \
	               --template-body file://$$template \
	               --region $(REGION) > /dev/null || exit 1; \
	       fi; \
	   done
	   @echo "✅ CloudFormation syntax check passed!"

# Rain syntax check (faster, handles parameters better)
syntax-check-rain:
	   @echo "🔍 Checking template syntax with Rain..."
	   @for template in templates/**/*.yml; do \
	       if [ -f "$$template" ]; then \
	           echo "Validating $$template..."; \
	           rain fmt --verify "$$template" || exit 1; \
	       fi; \
	   done
	   @echo "✅ Rain syntax check passed!"

# Validate templates with cfn-lint (better parameter handling)
cfn-lint:
	   @echo "🔍 Running cfn-lint validation..."
	   @if command -v cfn-lint >/dev/null 2>&1; then \
	       for template in templates/**/*.yml; do \
	           if [ -f "$$template" ]; then \
	               echo "Linting $$template..."; \
	               cfn-lint "$$template" || exit 1; \
	           fi; \
	       done; \
	       echo "✅ cfn-lint validation passed!"; \
	   else \
	       echo "⚠️  cfn-lint not installed. Run: make install-tools"; \
	   fi

# Pre-deployment checks
pre-check:
	   @echo "🚀 Running pre-deployment checks..."
	   @chmod +x scripts/validation/pre-deploy-check.sh
	   @./scripts/validation/pre-deploy-check.sh

# CFN-Guard validation
validate:
	   @echo "🔍 Running CFN-Guard validation..."
	   @chmod +x scripts/validation/validate-security.sh
	   @./scripts/validation/validate-security.sh

# Rain linting and formatting
lint:
	   @echo "🔧 Linting CloudFormation templates with Rain..."
	   @for template in templates/**/*.yml; do \
	       if [ -f "$$template" ]; then \
	           echo "Linting $$template..."; \
	           rain fmt --verify "$$template" || exit 1; \
	       fi; \
	   done
	   @echo "✅ Linting completed!"

# Format templates with Rain
format:
	   @echo "🎨 Formatting CloudFormation templates with Rain..."
	   @for template in templates/**/*.yml; do \
	       if [ -f "$$template" ]; then \
	           echo "Formatting $$template..."; \
	           rain fmt --write "$$template"; \
	       fi; \
	   done
	   @echo "✅ Templates formatted!"

# Check if templates need formatting
format-check:
	   @echo "🔍 Checking if templates need formatting..."
	   @for template in templates/**/*.yml; do \
	       if [ -f "$$template" ]; then \
	           echo "Checking format of $$template..."; \
	           if ! rain fmt --verify "$$template" >/dev/null 2>&1; then \
	               echo "❌ $$template needs formatting. Run 'make format'"; \
	               exit 1; \
	           fi; \
	       fi; \
	   done
	   @echo "✅ All templates are properly formatted!"

# Dry run deployment
deploy-dry:
	   @echo "🧪 Running dry-run deployment with Rain..."
	   @rain deploy templates/main.yml $(STACK_NAME) \
	       --params TemplateBucket=$(BUCKET_NAME) \
	       --params TemplatePrefix=$(TEMPLATE_PREFIX) \
	       --params Environment=$(ENVIRONMENT) \
	       --params ECSClusterNameParam=$(ECS_CLUSTER) \
	       --params RootDomainName=$(ROOT_DOMAIN_NAME) \
	       --params WWWDomainName=$(WWW_DOMAIN_NAME) \
	       --params Project1Domain=$(PROJECT1_DOMAIN) \
	       --params Project2Domain=$(PROJECT2_DOMAIN) \
	       --params ProjectFrontendEcommDomain=$(PROJECT3_FRONTEND_DOMAIN) \
	       --params ProjectBackendEcommDomain=$(PROJECT3_BACKEND_DOMAIN) \
	       --params HostedZoneId=$(HOSTED_ZONE_ID) \
	       --dry-run \
	       --region $(REGION)

# Preview changes with Rain
preview:
	   @echo "🔮 Previewing changes with Rain..."
	   @rain forecast templates/main.yml $(STACK_NAME) \
	       --params TemplateBucket=$(BUCKET_NAME) \
	       --params TemplatePrefix=$(TEMPLATE_PREFIX) \
	       --params Environment=$(ENVIRONMENT) \
	       --params ECSClusterNameParam=$(ECS_CLUSTER) \
	       --region $(REGION)

# === DEPLOYMENT ===

# Upload templates to S3
upload-templates:
	   @echo "📤 Uploading templates to S3..."
	   @aws s3 sync ./templates/ "s3://$(BUCKET_NAME)/$(TEMPLATE_PREFIX)" \
	       --exclude "*" \
	       --include "*.yml" \
	       --delete \
	       --region "$(REGION)"
	   @echo "✅ Templates uploaded to s3://$(BUCKET_NAME)/$(TEMPLATE_PREFIX)"

# Complete test suite with better parameter handling
test-all: format-check syntax-check-rain cfn-lint pre-check validate deploy-dry
	   @echo "🎉 All tests completed successfully!"

# Faster local test suite
test-local: format-check syntax-check-rain validate
	   @echo "🎉 Local tests completed successfully!"

# Quick development test (fastest)
test-quick: syntax-check-rain
	   @echo "🎉 Quick syntax check completed!"

# Deploy infrastructure
deploy: test-all upload-templates
	   @echo "🚀 Deploying infrastructure..."
	   @chmod +x scripts/deployment/deploy-infrastructure.sh
	   @./scripts/deployment/deploy-infrastructure.sh

# === MONITORING ===

# Monitor stack status
monitor:
	   @echo "📊 Monitoring stack status..."
	   @watch -n 30 "aws cloudformation describe-stacks \
	       --stack-name $(STACK_NAME) \
	       --region $(REGION) \
	       --query 'Stacks[0].StackStatus' \
	       --output text"

# Watch stack events with Rain
watch:
	   @echo "👀 Watching stack events with Rain..."
	   @rain watch $(STACK_NAME) --region $(REGION)

# Show stack outputs
outputs:
	   @echo "📋 Stack Outputs:"
	   @aws cloudformation describe-stacks \
	       --stack-name $(STACK_NAME) \
	       --region $(REGION) \
	       --query 'Stacks[0].Outputs[].[OutputKey,OutputValue,Description]' \
	       --output table

# Show stack events
events:
	   @echo "📝 Recent Stack Events:"
	   @aws cloudformation describe-stack-events \
	       --stack-name $(STACK_NAME) \
	       --region $(REGION) \
	       --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
	       --output table

# Show logs with Rain
logs:
	   @echo "📜 Showing stack logs with Rain..."
	   @rain logs $(STACK_NAME) --region $(REGION)

# === TOOLS INSTALLATION ===

install-tools:
	   @echo "🔧 Installing required tools..."
	   @# Install cfn-lint
	   @if command -v pip >/dev/null 2>&1; then \
	       pip install cfn-lint; \
	   elif command -v pip3 >/dev/null 2>&1; then \
	       pip3 install cfn-lint; \
	   else \
	       echo "❌ pip not found. Please install Python and pip first"; \
	   fi
	   @# Install Rain (macOS)
	   @if command -v brew >/dev/null 2>&1; then \
	       brew install rain; \
	   else \
	       echo "❌ Homebrew not found. Please install Rain manually"; \
	   fi
	   @# Install cfn-guard
	   @if command -v cargo >/dev/null 2>&1; then \
	       cargo install cfn-guard; \
	   else \
	       echo "⚠️  Rust/Cargo not found. Please install cfn-guard manually"; \
	   fi
	   @echo "✅ Tool installation completed!"

# Check if required tools are installed
check-tools:
	   @echo "🔍 Checking required tools..."
	   @tools="aws rain cfn-lint cfn-guard"; \
	   missing=""; \
	   for tool in $$tools; do \
	       if ! command -v $$tool >/dev/null 2>&1; then \
	           missing="$$missing $$tool"; \
	       else \
	           echo "✅ $$tool is installed"; \
	       fi; \
	   done; \
	   if [ -n "$$missing" ]; then \
	       echo "❌ Missing tools:$$missing"; \
	       echo "Run 'make install-tools' to install them"; \
	       exit 1; \
	   else \
	       echo "🎉 All required tools are installed!"; \
	   fi

# === CLEANUP ===

# Clean up stack
clean:
	   @echo "🗑️  Cleaning up stack..."
	   @aws cloudformation delete-stack \
	       --stack-name $(STACK_NAME) \
	       --region $(REGION)
	   @echo "Stack deletion initiated. Monitor with 'make monitor'"

# Force clean with Rain
clean-force:
	   @echo "🗑️  Force cleaning up stack with Rain..."
	   @rain rm $(STACK_NAME) --region $(REGION) || true

# === UTILITIES ===

# Show help
help:
	   @echo "Available targets:"
	   @echo ""
	   @echo "📋 Validation:"
	   @echo "  syntax-check-rain - Validate syntax with Rain (recommended)"
	   @echo "  syntax-check      - Validate CloudFormation syntax (AWS API)"
	   @echo "  cfn-lint          - Run cfn-lint validation"
	   @echo "  format-check      - Check if templates need formatting"
	   @echo "  validate          - Run CFN-Guard validation"
	   @echo ""
	   @echo "🔧 Formatting:"
	   @echo "  format            - Format templates with Rain"
	   @echo "  lint              - Verify template formatting"
	   @echo ""
	   @echo "🧪 Testing:"
	   @echo "  test-quick        - Quick syntax check only"
	   @echo "  test-local        - Local tests (faster)"
	   @echo "  test-all          - Complete test suite"
	   @echo "  deploy-dry        - Dry run deployment"
	   @echo "  preview           - Preview changes with Rain"
	   @echo ""
	   @echo "🚀 Deployment:"
	   @echo "  upload-templates  - Upload templates to S3"
	   @echo "  deploy            - Deploy infrastructure"
	   @echo ""
	   @echo "📊 Monitoring:"
	   @echo "  monitor           - Monitor stack status"
	   @echo "  watch             - Watch stack events with Rain"
	   @echo "  outputs           - Show stack outputs"
	   @echo "  events            - Show recent stack events"
	   @echo "  logs              - Show stack logs with Rain"
	   @echo ""
	   @echo "🔧 Tools:"
	   @echo "  install-tools     - Install required tools"
	   @echo "  check-tools       - Check if tools are installed"
	   @echo ""
	   @echo "🗑️  Cleanup:"
	   @echo "  clean             - Delete stack"
	   @echo "  clean-force       - Force delete with Rain"

# Default target
.DEFAULT_GOAL := help