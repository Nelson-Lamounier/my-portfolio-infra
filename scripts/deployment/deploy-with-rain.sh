#!/bin/bash
# @format

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}  Portfolio Infrastructure Deployment with Rain${NC}"

# Function to deploy a stack group
deploy_group() {
    local group=$1
    echo -e "${YELLOW}Deploying group: $group${NC}"
    
    case $group in
        "infrastructure")
            rain deploy vpc-stack --yes
            rain deploy cluster-stack --yes
            rain deploy loadbalancer-stack --yes
            ;;
        "services")
            rain deploy portfolio-service --yes
            rain deploy project1-service --yes
            rain deploy project2-service --yes
            ;;
        "pipelines")
            rain deploy portfolio-pipeline --yes
            rain deploy project1-pipeline --yes
            rain deploy project2-pipeline --yes
            ;;
        *)
            echo -e "${RED}Unknown deployment group: $group${NC}"
            exit 1
            ;;
    esac
}

# Parse command line arguments
DEPLOYMENT_GROUP=${1:-"all"}

case $DEPLOYMENT_GROUP in
    "all")
        echo -e "${YELLOW}Deploying all infrastructure...${NC}"
        deploy_group "infrastructure"
        deploy_group "services"
        deploy_group "pipelines"
        ;;
    "infrastructure"|"services"|"pipelines")
        deploy_group $DEPLOYMENT_GROUP
        ;;
    *)
        echo -e "${RED}Usage: $0 [all|infrastructure|services|pipelines]${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN} Deployment completed successfully!${NC}"