#!/bin/bash
set -e

# === LOAD CONFIG FROM .env ===
if [ -f .env ]; then
  # Load .env file, filtering out comments and empty lines
  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ $line =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    # Export the variable
    export "$line"
  done < .env
else
  echo ".env file not found. Please create one with your config."
  exit 1
fi

if [[ -z "$REGION" ]]; then
  echo "REGION not set in .env"
  exit 1
fi

# Set migration mode if not already set
MIGRATION_MODE="${MIGRATION_MODE:-migrate}"
export MIGRATION_MODE

# Updated required variables for dynamic pipelines
REQUIRED_VARS=(
  BUCKET_NAME TEMPLATE_PREFIX ARTIFACT_BUCKET ECS_CLUSTER
  PORTFOLIO_SERVICE_NAME STACK_NAME REGION ENVIRONMENT
  ROOT_DOMAIN_NAME WWW_DOMAIN_NAME PROJECT1_DOMAIN PROJECT2_DOMAIN
  PROJECT3_FRONTEND_DOMAIN PROJECT3_BACKEND_DOMAIN HOSTED_ZONE_ID
  # New variables for dynamic pipelines
  PROJECT1_REPO PROJECT1_CONNECTION_ARN PROJECT1_CONTAINER_NAME PROJECT1_ECR_REPO

)

# Check all required variables are set
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "Required variable $var is not set in .env"
    exit 1
  fi
done

# === STEP 1: Check/Create S3 Bucket ===
echo "Checking if S3 bucket '$BUCKET_NAME' exists..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket exists: $BUCKET_NAME"
else
    echo "Creating S3 bucket: $BUCKET_NAME"
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
fi

# # === STEP 2: Template Validation ===
# echo "Validating CloudFormation templates..."

# # Validate YAML syntax
# echo "Checking YAML syntax..."
# if command -v yamllint &> /dev/null; then
#     yamllint infra/
# else
#     echo "Warning: yamllint not installed. Skipping YAML validation."
# fi

# # Validate CloudFormation templates
# echo "Validating CloudFormation templates..."
# if command -v cfn-lint &> /dev/null; then
#     cfn-lint infra/MasterNestedStack.yml
#     cfn-lint infra/pipelines/DynamicPipeline.yml
#     cfn-lint infra/iam/CodeBuildPolicies.yml
#     cfn-lint infra/iam/CodePipelinePolicies.yml
# else
#     echo "Warning: cfn-lint not installed. Skipping CloudFormation validation."
# fi

# # AWS CloudFormation validate-template
# echo "Validating with AWS CloudFormation..."
# aws cloudformation validate-template \
#     --template-body file://infra/MasterNestedStack.yml \
#     --region "$REGION"

# === STEP 3: Upload CloudFormation Templates to S3 ===
echo "Syncing templates to S3..."
aws s3 sync ./infra/ "s3://${BUCKET_NAME}/${TEMPLATE_PREFIX}" \
    --exclude "*" \
    --include "*.yml" \
    --delete \
    --region "$REGION"

echo "Templates uploaded successfully to s3://${BUCKET_NAME}/${TEMPLATE_PREFIX}"
# # === STEP 3: Fetch Certificate ARN ===
# echo "Fetching Certificate ARN from us-east-1..."
# CERT_ARN=$(aws cloudformation describe-stacks \
#   --stack-name PortfolioCertificateStack \
#   --region eu-west-1 \
#   --query "Stacks[0].Outputs[?OutputKey=='SSLCertificateArn'].OutputValue" \
#   --output text)

# if [[ -z "$CERT_ARN" ]]; then
#   echo "Certificate not found. Please deploy certificate.yml first."
#   exit 1
# fi

# echo "Certificate ARN: $CERT_ARN"

# === STEP 4: Deploy Master Nested Stack ===
echo "Deploying Master Stack to $REGION..."
aws cloudformation deploy \
  --template-file ./infra/MasterNestedStack.yml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    TemplateBucket="$BUCKET_NAME" \
    TemplatePrefix="$TEMPLATE_PREFIX" \
    ArtifactBucket="$ARTIFACT_BUCKET" \
    ECSClusterNameParam="$ECS_CLUSTER" \
    Region="$REGION" \
    CidrIp="$CIDR_IP" \
    RootDomainName="$ROOT_DOMAIN_NAME" \
    WWWDomainName="$WWW_DOMAIN_NAME" \
    Project1Domain="$PROJECT1_DOMAIN" \
    Project2Domain="$PROJECT2_DOMAIN" \
    ProjectFrontendEcommDomain="$PROJECT3_FRONTEND_DOMAIN" \
    ProjectBackendEcommDomain="$PROJECT3_BACKEND_DOMAIN" \
    HostedZoneId="$HOSTED_ZONE_ID" \
    Environment="$ENVIRONMENT" \
    PortfolioRepositoryId="$PORTFOLIO_REPO" \
    PortfolioConnectionArn="$PORTFOLIO_CONNECTION_ARN" \
    PortfolioContainerName="$PORTFOLIO_CONTAINER_NAME" \
    PortfolioECRRepository="$PORTFOLIO_ECR_REPO" \
    Project1RepositoryId="$PROJECT1_REPO" \
    Project1ConnectionArn="$PROJECT1_CONNECTION_ARN" \
    Project1ContainerName="$PROJECT1_CONTAINER_NAME" \
    Project1ECRRepository="$PROJECT1_ECR_REPO" \
    Project2RepositoryId="$PROJECT2_REPO" \
    Project2ConnectionArn="$PROJECT2_CONNECTION_ARN" \
    Project2ContainerName="$PROJECT2_CONTAINER_NAME" \
    Project2ECRRepository="$PROJECT2_ECR_REPO" \
    ProjectFullStackRepositoryId="$PROJECT3_REPO" \
    ProjectFullStackConnectionArn="$PROJECT3_CONNECTION_ARN" \
    ProjectFullStackContainerName="$PROJECT3_CONTAINER_NAME" \
    ProjectFullStackSecondaryContainerName="$PROJECT3_SECONDARY_CONTAINER_NAME" \
    ProjectFullStackECRRepository="$PROJECT3_ECR_REPO" \
    ProjectFullStackSecondaryECRRepository="$PROJECT3_SECONDARY_ECR_REPO" \
    MigrationMode="$MIGRATION_MODE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo "Master stack deployment initiated..."

# === STEP 5: Monitor Stack and Cancel If Timeout ===
echo "⏱️ Monitoring stack for up to 20 minutes..."
TIMEOUT=1200  # 20 minutes (increased for nested stacks)
START_TIME=$(date +%s)

while true; do
  STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || echo "STACK_NOT_FOUND")

  if [ "$STATUS" = "STACK_NOT_FOUND" ]; then
    echo "Stack not found. May have been deleted or never created."
    exit 1
  fi

  echo "Stack status: $STATUS ($(date '+%H:%M:%S'))"

  case "$STATUS" in
    *"COMPLETE"*)
      echo "✅ Stack completed successfully: $STATUS"
      break
      ;;
    *"ROLLBACK"*|*"FAILED"*)
      echo "❌ Stack failed or rolled back: $STATUS"
      echo "Checking recent stack events for errors..."
      aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'StackEvents[0:5].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
        --output table
      exit 1
      ;;
    *"IN_PROGRESS"*)
      echo "⏳ Stack operation in progress..."
      ;;
  esac

  ELAPSED=$(( $(date +%s) - $START_TIME ))
  if (( ELAPSED > TIMEOUT )); then
    echo "⏰ Timeout reached after $((TIMEOUT/60)) minutes. Cancelling update..."
    aws cloudformation cancel-update-stack \
      --stack-name "$STACK_NAME" \
      --region "$REGION" 2>/dev/null || echo "Cancel operation failed or not applicable"
    exit 1
  fi

  sleep 30
done

# === STEP 6: Display Stack Outputs ===
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[].[OutputKey,OutputValue,Description]' \
  --output table 2>/dev/null || echo "No outputs available"

echo "🎉 Deployment completed successfully!"

