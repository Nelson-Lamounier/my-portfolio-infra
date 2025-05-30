#!/bin/bash
set -e

# === LOAD CONFIG FROM .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Please create one with your config."
  exit 1
fi

# === VALIDATE REQUIRED VARIABLES ===
if [[ -z "$ROOT_DOMAIN_NAME" ||  -z "$WWW_DOMAIN_NAME" || -z "$HOSTED_ZONE_ID" ]]; then
  echo "ROOT_DOMAIN_NAME / WWW_DOMAIN_NAME and/or HOSTED_ZONE_ID not set in .env"
  exit 1
fi

CERT_REGION="eu-west-1"

echo "Deploying certificate to $CERT_REGION for domain: $ROOT_DOMAIN_NAME"

aws cloudformation deploy \
  --template-file ./infra/certificate.yml \
  --stack-name PortfolioCertificateStack \
  --parameter-overrides \
    WWWDomainName="$WWW_DOMAIN_NAME" \
    RootDomainName="$ROOT_DOMAIN_NAME" \
    Project1DomainName="$SUB_1_DOMAIN_NAME" \
    Project2DomainName="$SUB_2_DOMAIN_NAME" \
    ProjectFEDomainName="$PROJECT_FRONTEND_ECOMM_DOMAIN" \
    ProjectBEDomainName="$PROJECT_BACKEND_ECOMM_DOMAIN" \
    HostedZoneId="$HOSTED_ZONE_ID" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$CERT_REGION"

# === Wait for Certificate to Be ISSUED ===
echo "Waiting for ACM certificate to be ISSUED..."

CERT_ARN=$(aws cloudformation describe-stacks \
  --stack-name PortfolioCertificateStack \
  --region "$CERT_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='SSLCertificateArn'].OutputValue" \
  --output text)

if [[ -z "$CERT_ARN" ]]; then
  echo "Failed to retrieve certificate ARN. Stack might have failed."
  exit 1
fi

echo "Certificate ARN: $CERT_ARN"

while true; do
  STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$CERT_REGION" \
    --query "Certificate.Status" \
    --output text)

  echo "Certificate status: $STATUS"

  if [ "$STATUS" == "ISSUED" ]; then
    echo "Certificate issued successfully!"
    break
  elif [ "$STATUS" == "FAILED" ]; then
    echo "Certificate validation failed."
    exit 1
  fi

  sleep 10
done