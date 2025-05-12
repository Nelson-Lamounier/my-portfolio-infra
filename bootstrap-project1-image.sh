#!/bin/bash

# ==== CONFIG ====
REGION="eu-west-1"
ACCOUNT_ID="711387127421"
REPO_NAME="project1-dev"

# ==== AUTH ====
echo "Logging into Amazon ECR..."
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# ==== BUILD ====
echo "🔧 Building Docker image..."
docker build -t $REPO_NAME .

# ==== TAG ====
echo "Tagging image for ECR..."
docker tag $REPO_NAME:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest

# ==== PUSH ====
echo "Pushing image to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest

echo "Done. Image pushed to ECR and ready for ECS deployment."