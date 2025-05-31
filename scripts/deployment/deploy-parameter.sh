#!/bin/bash

set -e

ENVIRONMENT=${1:-dev}
CONFIG_FILE="config/environments/$ENVIRONMENT.yml"
PARAM_FILE="parameters/$ENVIRONMENT.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "🔄 Converting $CONFIG_FILE to CloudFormation parameters..."

# Create parameters directory
mkdir -p parameters

# Generate CloudFormation parameters from config
cat > "$PARAM_FILE" << EOF
# CloudFormation Parameters for $ENVIRONMENT environment
# Generated from $CONFIG_FILE on $(date)

# Environment Configuration
Environment: $(yq eval '.environment' "$CONFIG_FILE")
Region: $(yq eval '.region' "$CONFIG_FILE")

# VPC Configuration
VpcCidr: $(yq eval '.vpc.cidr' "$CONFIG_FILE")
EnableVpcFlowLogs: $(yq eval '.vpc.enable_flow_logs' "$CONFIG_FILE")

# ECS Configuration
ECSInstanceType: $(yq eval '.ecs.instance_type' "$CONFIG_FILE")
MinSize: $(yq eval '.ecs.min_size' "$CONFIG_FILE")
MaxSize: $(yq eval '.ecs.max_size' "$CONFIG_FILE")
DesiredCapacity: $(yq eval '.ecs.desired_capacity' "$CONFIG_FILE")

# Domain Configuration
RootDomainName: $(yq eval '.domains.root' "$CONFIG_FILE")
WWWDomainName: $(yq eval '.domains.www' "$CONFIG_FILE")
ProjectBackendEcommDomain: $(yq eval '.domains.api' "$CONFIG_FILE")
EOF

# Add static values from .env file
if [ -f ".env" ]; then
    source .env
    cat >> "$PARAM_FILE" << EOF

# Template Configuration (from .env)
TemplateBucket: $BUCKET_NAME
TemplatePrefix: $TEMPLATE_PREFIX
ArtifactBucket: $ARTIFACT_BUCKET
ECSClusterNameParam: $ECS_CLUSTER
CidrIp: $CIDR_IP
MigrationMode: $MIGRATION_MODE
EOF
fi

echo "✅ CloudFormation parameters generated: $PARAM_FILE"