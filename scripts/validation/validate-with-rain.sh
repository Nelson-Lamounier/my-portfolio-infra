#!/bin/bash
# @format

set -e

echo " Validating CloudFormation templates with Rain..."

# Validate all templates
for template in infra/**/*.yml; do
    echo "Validating: $template"
    rain fmt --verify "$template"
    rain forecast --no-exec "$template"
done

echo "All templates validated successfully!"