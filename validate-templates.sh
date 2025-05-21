#!/bin/bash
set -e

# === Load config from .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Exiting."
  exit 1
fi

DRY_STACK_NAME="${STACK_NAME}-DryRun"

echo "🔍 Linting CloudFormation templates in ./infra/"
for template in ./infra/*.yml; do 
  echo "Linting $template..."
  cfn-lint "$template" || { echo " Lint failed: $template"; exit 1; }
done

echo "All templates passed linting."

echo "Creating dry-run change set for $DRY_STACK_NAME..."

aws cloudformation create-change-set \
  --stack-name "${STACK_NAME}-DryRun" \
   --change-set-name dryrun-test \
  --template-body file://infra/MasterNestedStack.yml \
  --change-set-name dryrun-test \
  --change-set-type CREATE \
  --parameters \
    ParameterKey=TemplateBucket,ParameterValue=$BUCKET_NAME \
    ParameterKey=TemplatePrefix,ParameterValue=$TEMPLATE_PREFIX \
    ParameterKey=ArtifactBucket,ParameterValue=$ARTIFACT_BUCKET \
    ParameterKey=ECSCluster,ParameterValue=$ECS_CLUSTER \
    ParameterKey=ECSClusterNameParam,ParameterValue=$ECSClusterNameParam \
    ParameterKey=Region,ParameterValue=$REGION \
    ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    ParameterKey=RootDomainName,ParameterValue=$ROOT_DOMAIN_NAME \
    ParameterKey=WWWDomainName,ParameterValue=$WWW_DOMAIN_NAME \
    ParameterKey=Project1Domain,ParameterValue=$PROJECT1_DOMAIN \
    ParameterKey=Project2Domain,ParameterValue=$PROJECT2_DOMAIN \
    ParameterKey=ProjectFrontendEcommDomain,ParameterValue=$PROJECT3_FRONTEND_DOMAIN \
    ParameterKey=ProjectBackendEcommDomain,ParameterValue=$PROJECT3_BACKEND_DOMAIN \
    ParameterKey=HostedZoneId,ParameterValue=$HOSTED_ZONE_ID \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION" > /dev/null

echo "Waiting for change set creation..."
aws cloudformation wait change-set-create-complete \
  --stack-name "${STACK_NAME}-DryRun" \
  --change-set-name dryrun-test \
  --region "$REGION"

echo "Dry-run change set ready. Here's what will be deployed:"
aws cloudformation describe-change-set \
  --stack-name "$DRY_STACK_NAME" \
  --change-set-name dryrun-test \
  --region "$REGION" \
  --query 'Changes[*].ResourceChange'

echo "Cleaning up dry-run change set..."
aws cloudformation delete-change-set \
  --stack-name "$DRY_STACK_NAME" \
  --change-set-name dryrun-test \
  --region "$REGION"

echo "Validation complete."