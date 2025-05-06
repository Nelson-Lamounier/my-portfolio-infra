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
if [[ -z "$ROOT_DOMAIN_NAME" || -z "$WWW_DOMAIN_NAME" || -z "$HOSTED_ZONE_ID" || -z "$ALB_DNS_NAME" || -z "$ALB_HOSTED_ZONE_ID" || -z "$REGION" ]]; then
  echo "One or more required variables are missing from .env:"
  echo "Expected: DOMAIN_NAME, HOSTED_ZONE_ID, ALB_DNS_NAME, ALB_HOSTED_ZONE_ID, REGION"
  exit 1
fi

echo "Deploying PortfolioDNSStack in region: $REGION"
echo "Root Domain: $ROOT_DOMAIN_NAME"
echo "WWW Domain: $WWW_DOMAIN_NAME"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "ALB DNS Name: $ALB_DNS_NAME"
echo "ALB Hosted Zone ID: $ALB_HOSTED_ZONE_ID"

aws cloudformation deploy \
  --template-file ./infra/dns.yml \
  --stack-name PortfolioDNSStack \
  --parameter-overrides \
    WWWDomainName="$WWW_DOMAIN_NAME" \
    RootDomainName="$ROOT_DOMAIN_NAME" \
    HostedZoneId="$HOSTED_ZONE_ID" \
    LoadBalancerDNS="$ALB_DNS_NAME" \
    LoadBalancerHostedZoneId="$ALB_HOSTED_ZONE_ID" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo "DNS stack deployed successfully: PortfolioDNSStack"