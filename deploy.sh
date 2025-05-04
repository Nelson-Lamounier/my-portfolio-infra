#!/bin/bash

# === LOAD CONFIG FROM .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Please create one with your config."
  exit 1
fi

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

# === STEP 2: Upload CloudFormation templates ===
echo "Uploading templates to S3..."
aws s3 cp ./infra/ s3://$BUCKET_NAME/$TEMPLATE_PREFIX --recursive --exclude "*" --include "*.yml"

# === STEP 3: Deploy Master Nested Stack ===
echo "Deploying master CloudFormation stack..."
aws cloudformation deploy \
    --template-file ./infra/MasterNestedStack.yml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    TemplateBucket="$BUCKET_NAME" \
    TemplatePrefix="$TEMPLATE_PREFIX" \
    ArtifactBucket="$ARTIFACT_BUCKET" \
    ECSCluster="$ECS_CLUSTER" \
    ECSClusterNameParam="$ECSClusterNameParam" \
    ECSServiceNameParam="$ECSServiceNameParam" \
    Region="$Region" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo " Deployment initiated for: $STACK_NAME"