#!/bin/bash

set -e  # Exit on any error

echo "🔍 Running CFN-Guard Security Validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
FAILED_TESTS=0

# Function to run validation
run_validation() {
    local template=$1
    local rule_file=$2
    local rule_name=$(basename "$rule_file" .guard)
    
    echo -e "${YELLOW}  -> Running $rule_name rules${NC}"
    
    if cfn-guard validate --rules "$rule_file" --data "$template" --show-summary; then
        echo -e "${GREEN}    ✓ PASSED${NC}"
    else
        echo -e "${RED}    ✗ FAILED${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Validate all templates against all rules
echo "📋 Running comprehensive validation..."
for template in templates/**/*.yml; do
    if [[ -f "$template" ]]; then
        echo -e "\n${YELLOW}Validating $(basename $template)...${NC}"
        
        for rule_file in cfn-guard-rules/*.guard; do
            if [[ -f "$rule_file" ]]; then
                run_validation "$template" "$rule_file"
            fi
        done
    fi
done

# Targeted validation for specific components
echo -e "\n📊 Running targeted validation..."

# Networking templates
if ls templates/networking/*.yml 1> /dev/null 2>&1; then
    echo -e "\n${YELLOW}Validating networking templates...${NC}"
    for template in templates/networking/*.yml; do
        if [[ -f "cfn-guard-rules/networking-security.guard" ]]; then
            run_validation "$template" "cfn-guard-rules/networking-security.guard"
        fi
    done
fi

# Compute templates
if ls templates/compute/*.yml 1> /dev/null 2>&1; then
    echo -e "\n${YELLOW}Validating compute templates...${NC}"
    for template in templates/compute/*.yml; do
        if [[ -f "cfn-guard-rules/compute-security.guard" ]]; then
            run_validation "$template" "cfn-guard-rules/compute-security.guard"
        fi
    done
fi

# Summary
echo -e "\n📈 Validation Summary:"
echo -e "Total tests: $TOTAL_TESTS"
echo -e "Failed tests: $FAILED_TESTS"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}🎉 All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS validation(s) failed!${NC}"
    exit 1
fi