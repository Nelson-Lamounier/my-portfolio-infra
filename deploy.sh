#!/bin/bash
set -e

# === LOAD CONFIG FROM .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Please create one with your config."
  exit 1
fi

if [[ -z "$REGION" ]]; then
  echo "REGION not set in .env"
  exit 1
fi

# === STEP 1: Check/Create S3 Bucket ===
echo "🔍 Checking if S3 bucket '$BUCKET_NAME' exists..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket exists: $BUCKET_NAME"
else
    echo "Creating S3 bucket: $BUCKET_NAME"
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
fi

# === STEP 2: Upload CloudFormation templates ===
echo "Uploading templates to S3..."
aws s3 cp ./infra/ s3://"$BUCKET_NAME"/"$TEMPLATE_PREFIX" --recursive --exclude "*" --include "*.yml"


# === STEP 3: Fetch Certificate ARN ===
echo "Fetching Certificate ARN from us-east-1..."
CERT_ARN=$(aws cloudformation describe-stacks \
  --stack-name PortfolioCertificateStack \
  --region eu-west-1 \
  --query "Stacks[0].Outputs[?OutputKey=='SSLCertificateArn'].OutputValue" \
  --output text)

if [[ -z "$CERT_ARN" ]]; then
  echo "Certificate not found. Please deploy certificate.yml first."
  exit 1
fi

echo "Certificate ARN: $CERT_ARN"

# === STEP 4: Deploy Master Nested Stack ===
echo "Deploying Master Stack to $REGION..."
aws cloudformation deploy \
  --template-file ./infra/MasterNestedStack.yml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    TemplateBucket="$BUCKET_NAME" \
    TemplatePrefix="$TEMPLATE_PREFIX" \
    ArtifactBucket="$ARTIFACT_BUCKET" \
    ECSCluster="$ECS_CLUSTER" \
    ECSClusterNameParam="$ECSClusterNameParam" \
    Region="$REGION" \
    SSLCertificateArn="$CERT_ARN" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo "Master stack deployed successfully."

# === STEP 5: Monitor Stack and Cancel If Timeout ===
echo "⏱️ Monitoring stack for up to 15 minutes..."
STACK_NAME="PortfolioMasterStack"
TIMEOUT=900  # 15 minutes
START_TIME=$(date +%s)

while true; do
  STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].StackStatus" \
    --output text)

  echo "Stack status: $STATUS"

  if [[ "$STATUS" == *"COMPLETE"* ]]; then
    echo "Stack completed: $STATUS"
    break
  elif [[ "$STATUS" == *"ROLLBACK"* || "$STATUS" == *"FAILED"* ]]; then
    echo "Stack failed or rolled back: $STATUS"
    break
  fi

  ELAPSED=$(( $(date +%s) - $START_TIME ))
  if (( ELAPSED > TIMEOUT )); then
    echo "Timeout reached. Cancelling update..."
    aws cloudformation cancel-update-stack --stack-name $STACK_NAME --region $REGION
    break
  fi

  sleep 20
done

