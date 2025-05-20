#!/bin/bash

set -e

# === LOAD .env CONFIG ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found."
  exit 1
fi

# === CHECK REQUIRED VARIABLES ===
if [[ -z "$ROOT_DOMAIN_NAME" || -z "$WWW_DOMAIN_NAME" || -z "$HOSTED_ZONE_ID" || -z "$PROJECT1_DOMAIN" || -z "$PROJECT2_DOMAIN" ||  -z "$PROJECT_FRONTEND_ECOMM_DOMAIN" ||  -z "$PROJECT_BACKEND_ECOMM_DOMAIN" || -z "$ALB_HOSTED_ZONE_ID" || -z "$REGION" ]]; then
  echo "One or more required variables are missing from .env:"
  echo "Expected: ROOT_DOMAIN_NAME, WWW_DOMAIN_NAME, HOSTED_ZONE_ID, ALB_HOSTED_ZONE_ID, REGION"
  exit 1
fi

echo "Deploying PortfolioDNSStack in region: $REGION"
echo "Root Domain: $ROOT_DOMAIN_NAME"
echo "WWW Domain: $WWW_DOMAIN_NAME"
echo "Project 1 Domain: $PROJECT1_DOMAIN"
echo "Project 2 Domain: $PROJECT1_DOMAIN"
echo "Project Frontend Ecomm Domain: $PROJECT_FRONTEND_ECOMM_DOMAIN"
echo "Project Backend Ecomm Domain: $PROJECT_BACKEND_ECOMM_DOMAIN"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "ALB Hosted Zone ID: $ALB_HOSTED_ZONE_ID"

aws cloudformation deploy \
  --template-file ./infra/dns.yml \
  --stack-name PortfolioDNSStack \
  --parameter-overrides \
    WWWDomainName="$WWW_DOMAIN_NAME" \
    RootDomainName="$ROOT_DOMAIN_NAME" \
    Project1Domain="$PROJECT1_DOMAIN" \
    Project2Domain="$PROJECT2_DOMAIN" \
    ProjectFrontendEcommDomain="$PROJECT_FRONTEND_ECOMM_DOMAIN" \
    ProjectBackendEcommDomain="$PROJECT_BACKEND_ECOMM_DOMAIN" \
    HostedZoneId="$HOSTED_ZONE_ID" \
    LoadBalancerHostedZoneId="$ALB_HOSTED_ZONE_ID" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo "DNS stack deployed successfully: PortfolioDNSStack"
