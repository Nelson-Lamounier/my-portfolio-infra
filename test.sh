#!/bin/bash

# === Load config from .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Exiting."
  exit 1

fi

# echo $STACK_NAME
# echo $BUCKET_NAME
# echo $ECS_CLUSTER
# echo $ARTIFACT_BUCKET
# echo $REGION
# echo $TEMPLATE_PREFIX

# === Step 1: Link all templates ===
echo " Running cfn-lint on ./infra/*.yml templates..."
for template in ./infra/*.yml; do 
  echo "Linting $template.."
  cfn-lint "$template" || { echo "Linting failed on $template"; exit 1;}
done 

echo "Linting passed for all templates."

# === Step 2: Create Change Set for dry-run ===
echo "Creating dry-run change set for $STACK_NAME..."

aws cloudformation create-change-set \
  --stack-name "${STACK_NAME}-Dry-Run" \
  --template-body file://infra/MasterNestedStack.yml \
  --change-set-name dryrun-test \
  --change-set-type CREATE \
  --parameters \
    ParameterKey=TemplateBucket,ParameterValue=$BUCKET_NAME \
    ParameterKey=TemplatePrefix,ParameterValue=$TEMPLATE_PREFIX \
    ParameterKey=ArtifactBucket,ParameterValue=$ARTIFACT_BUCKET \
    ParameterKey=ECSCluster,ParameterValue=$ECS_CLUSTER \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION > /dev/null



if [ $? -ne 0 ]; then
  echo "Failed to create change set."
  exit 1
fi

echo "Waiting for change set creation..."
aws cloudformation wait change-set-create-complete \
  --stack-name "${STACK_NAME}-DryRun" \
  --region $REGION

# === Step 3: Show the change set preview ===
echo "Dry-run complet. Here's what will be deployed:"
aws cloudformation describe-change-set \
  --stack-name "${STACK_NAME}-Dry-Run" \
  --change-set-name dryrun-test \
  --region $REGION \
  --query 'Change[*].ResourceChange'

# === Optional: Delete test stack afterward ===
echo "Cleaning up dry-run stack..."
aws cloudformation delete-change-set \
  --stack-name "${STACK_NAME}-Dry-Run" \
  --change-set-name dryrun-test \
  --region $REGION