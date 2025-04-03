#!/bin/bash

# === LOAD CONFIG FROM .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Please create one with your config."
  exit 1
fi

# READ ARGUMENTS
TEMPLATE_FILE=$1
STACK_NAME=$2

# SAFETY CHECK
: "${TEMPLATE_FILE:?Template file patch is required}"
: "${STACK_NAME:?Stack name is required}"
: "${ECS_CLUSTER:?ECS_CLUSTER is not set}"
: "${REGION:?REGION is not set}"
: "${STACK_NAME:?STACK_NAME is not set}"
: "${TEMPLATE_FILE:?TEMPLATE_FILE is not set}"
: "${ECS_SERVICE_NAME:?ECS_SERVICE_NAME is not set}"

read -p "Are you sure you want to update the stack $SATCK_NAME? (y/N): " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || exit 1

# === STEP 1: Update CloudFormation template ===

echo "Uploading template change for stack ${STACK_NAME}..."

aws cloudformation update-stack \
  --stack-name "$STACK_NAME" \
  --template-body "file://$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=ECSClusterNameParam,ParameterValue=$ECS_CLUSTER \
    ParameterKey=Region,ParameterValue=$REGION \
    ParameterKey=ECSServiceNameParam,ParameterValue=$ECS_SERVICE_NAME


