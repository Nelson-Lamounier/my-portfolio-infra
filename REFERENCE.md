<!-- @format -->

# Install AWS CLI (if not already installed)

curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install yamllint for YAML validation

pip install yamllint

# Install cfn-lint for CloudFormation-specific validation

pip install cfn-lint

# Configure AWS CLI

aws configure

# Set common environment variables

export AWS_REGION="eu-west-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export TEMPLATE_BUCKET="your-template-bucket-name"
export ARTIFACT_BUCKET="your-artifact-bucket-name"
export ENVIRONMENT="dev" # or "prod"

# Validate individual template syntax

yamllint infra/MasterNestedStack.yml
yamllint infra/pipelines/DynamicPipeline.yml
yamllint infra/iam/CodeBuildPolicies.yml
yamllint infra/iam/CodePipelinePolicies.yml

# Validate all templates in a directory

yamllint infra/

# Custom yamllint configuration (create .yamllint file)

yamllint -c .yamllint infra/

# Validate CloudFormation template structure

cfn-lint infra/MasterNestedStack.yml
cfn-lint infra/pipelines/DynamicPipeline.yml

# Validate with AWS CLI (requires AWS credentials)

aws cloudformation validate-template \
 --template-body file://infra/MasterNestedStack.yml

aws cloudformation validate-template \
 --template-body file://infra/pipelines/DynamicPipeline.yml

# Validate nested templates

aws cloudformation validate-template \
 --template-body file://infra/iam/CodeBuildPolicies.yml

aws cloudformation validate-template \
 --template-body file://infra/iam/CodePipelinePolicies.yml

# Upload all templates to S3 bucket

aws s3 sync infra/ s3://${TEMPLATE*BUCKET}/infra/ \
 --exclude "*.md" \
 --exclude ".git/\_" \
 --delete

# Upload specific template

aws s3 cp infra/pipelines/DynamicPipeline.yml \
 s3://${TEMPLATE_BUCKET}/infra/pipelines/

# Upload with versioning

aws s3 cp infra/MasterNestedStack.yml \
 s3://${TEMPLATE_BUCKET}/infra/MasterNestedStack-$(date +%Y%m%d-%H%M%S).yml

# Set public read permissions (if needed)

aws s3api put-object-acl \
 --bucket ${TEMPLATE_BUCKET} \
 --key infra/MasterNestedStack.yml \
 --acl public-read

# Check template accessibility

curl -I https://${TEMPLATE_BUCKET}.s3.${AWS_REGION}.amazonaws.com/infra/pipelines/DynamicPipeline.yml

# List templates in bucket

aws s3 ls s3://${TEMPLATE_BUCKET}/infra/ --recursive

# Deploy master nested stack

aws cloudformation deploy \
 --template-file infra/MasterNestedStack.yml \
 --stack-name PortfolioMasterStack \
 --parameter-overrides \
 Environment=${ENVIRONMENT} \
    TemplateBucket=${TEMPLATE_BUCKET} \
 TemplatePrefix="infra/" \
 ArtifactBucket=${ARTIFACT_BUCKET} \
    ECSClusterNameParam="portfolio-cluster" \
    Region=${AWS_REGION} \
 RootDomainName="yourdomain.com" \
 WWWDomainName="www.yourdomain.com" \
 Project1Domain="project1.yourdomain.com" \
 Project2Domain="project2.yourdomain.com" \
 ProjectFrontendEcommDomain="shop.yourdomain.com" \
 ProjectBackendEcommDomain="api.yourdomain.com" \
 HostedZoneId="Z1234567890ABC" \
 --capabilities CAPABILITY_NAMED_IAM \
 --tags \
 Project=Portfolio \
 Environment=${ENVIRONMENT} \
 Owner=Nelson

# Test Dynamic Pipeline stack independently

    aws cloudformation deploy \
      --template-file infra/pipelines/DynamicPipeline.yml \
      --stack-name TestProject1Pipeline \
      --parameter-overrides \
        ArtifactBucket=${ARTIFACT_BUCKET} \
        ServiceName="project1-service" \
        ProjectName="Project1" \
        RepositoryId="Nelson-Lamounier/magic-rainbow-demo" \
        ConnectionArn="arn:aws:codeconnections:${AWS_REGION}:${AWS_ACCOUNT_ID}:connection/a0ea9026-2c2c-40a7-8120-433cc6a49163" \
        ContainerName="project1-container" \
        ECRRepositoryName="project1-dev" \
        TemplateBucket=${TEMPLATE_BUCKET} \
      --capabilities CAPABILITY_NAMED_IAM

# Test IAM policies stack

    aws cloudformation deploy \
      --template-file infra/iam/CodeBuildPolicies.yml \
      --stack-name TestCodeBuildPolicies \
      --parameter-overrides \
        ArtifactBucket=${ARTIFACT_BUCKET} \
        ProjectName="TestProject" \
      --capabilities CAPABILITY_NAMED_IAM

# Check stack status

aws cloudformation describe-stacks \
 --stack-name PortfolioMasterStack \
 --query 'Stacks[0].StackStatus'

# List all stacks

aws cloudformation list-stacks \
 --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
 --query 'StackSummaries[].{Name:StackName,Status:StackStatus}'

# Get stack outputs

aws cloudformation describe-stacks \
 --stack-name PortfolioMasterStack \
 --query 'Stacks[0].Outputs'

# Get stack parameters

aws cloudformation describe-stacks \
 --stack-name PortfolioMasterStack \
 --query 'Stacks[0].Parameters'

# Update existing stack

aws cloudformation deploy \
 --template-file infra/MasterNestedStack.yml \
 --stack-name PortfolioMasterStack \
 --parameter-overrides Environment=${ENVIRONMENT} \
 --capabilities CAPABILITY_NAMED_IAM \
 --no-fail-on-empty-changeset

# Start pipeline execution

aws codepipeline start-pipeline-execution \
 --name Project1-Pipeline

# Get pipeline execution status

aws codepipeline get-pipeline-execution \
 --pipeline-name Project1-Pipeline \
 --pipeline-execution-id "execution-id"

# List pipeline executions

aws codepipeline list-pipeline-executions \
 --pipeline-name Project1-Pipeline \
 --max-items 10

# Get pipeline state

aws codepipeline get-pipeline-state \
 --name Project1-Pipeline

# Get action execution details

aws codepipeline list-action-executions \
 --pipeline-name Project1-Pipeline \
 --max-items 5

# Get stack events (recent first)

aws cloudformation describe-stack-events \
 --stack-name PortfolioMasterStack \
 --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
 --output table

# Get failed resources

aws cloudformation describe-stack-events \
 --stack-name PortfolioMasterStack \
 --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
 --output table

# Get nested stack events

aws cloudformation describe-stack-events \
 --stack-name PortfolioMasterStack-Project1PipelineStack-ABC123

# List stack resources

aws cloudformation list-stack-resources \
 --stack-name PortfolioMasterStack \
 --query 'StackResourceSummaries[].[LogicalResourceId,ResourceType,ResourceStatus]' \
 --output table

# Get resource details

aws cloudformation describe-stack-resource \
 --stack-name PortfolioMasterStack \
 --logical-resource-id Project1PipelineStack

# Check if resource exists

aws ecs describe-services \
 --cluster portfolio-cluster \
 --services project1-service

# Detect stack drift

aws cloudformation detect-stack-drift \
 --stack-name PortfolioMasterStack

# Get drift detection results

aws cloudformation describe-stack-drift-detection-status \
 --stack-drift-detection-id "drift-detection-id"

# List CodeBuild log groups

aws logs describe-log-groups \
 --log-group-name-prefix "/aws/codebuild/Project1-CodeBuild"

# Get CodeBuild logs

aws logs get-log-events \
 --log-group-name "/aws/codebuild/Project1-CodeBuild" \
 --log-stream-name "log-stream-name"

# Tail logs in real-time

aws logs tail "/aws/codebuild/Project1-CodeBuild" --follow

# Check ECS service status

aws ecs describe-services \
 --cluster portfolio-cluster \
 --services project1-service \
 --query 'services[0].{Status:status,Running:runningCount,Pending:pendingCount,Desired:desiredCount}'

# Get ECS service events

aws ecs describe-services \
 --cluster portfolio-cluster \
 --services project1-service \
 --query 'services[0].events[0:5].[createdAt,message]' \
 --output table

# Delete master stack (deletes all nested stacks)

aws cloudformation delete-stack \
 --stack-name PortfolioMasterStack

# Delete individual nested stack

aws cloudformation delete-stack \
 --stack-name TestProject1Pipeline

# Wait for deletion to complete

aws cloudformation wait stack-delete-complete \
 --stack-name PortfolioMasterStack

# Empty artifact bucket

aws s3 rm s3://${ARTIFACT_BUCKET} --recursive

# Empty template bucket

aws s3 rm s3://${TEMPLATE_BUCKET} --recursive

# Delete buckets

aws s3 rb s3://${ARTIFACT_BUCKET}
aws s3 rb s3://${TEMPLATE_BUCKET}

# Force delete stack (use with caution)

aws cloudformation delete-stack \
 --stack-name PortfolioMasterStack \
 --retain-resources

# List all stacks for manual cleanup

aws cloudformation list-stacks \
 --query 'StackSummaries[?StackStatus!=`DELETE_COMPLETE`].[StackName,StackStatus]' \
 --output table

# 1. Validate templates

yamllint infra/ && cfn-lint infra/MasterNestedStack.yml

# 2. Upload to S3

aws s3 sync infra/ s3://${TEMPLATE_BUCKET}/infra/ --delete

# 3. Deploy/Update stack

aws cloudformation deploy \
 --template-file infra/MasterNestedStack.yml \
 --stack-name PortfolioMasterStack \
 --parameter-overrides Environment=${ENVIRONMENT} \
 --capabilities CAPABILITY_NAMED_IAM

# 4. Check status

aws cloudformation describe-stacks \
 --stack-name PortfolioMasterStack \
 --query 'Stacks[0].StackStatus'

# Quick health check

aws cloudformation describe-stack-events \
 --stack-name PortfolioMasterStack \
 --query 'StackEvents[0:5].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]' \
 --output table

# Check pipeline status

aws codepipeline get-pipeline-state --name Project1-Pipeline

# Check ECS services

aws ecs describe-services \
 --cluster portfolio-cluster \
 --services project1-service project2-service portfolio-service \
 --query 'services[].[serviceName,status,runningCount,desiredCount]' \
 --output table

# Note: Replace placeholder values (bucket names, domain names, connection ARNs) with your actual values before running commands.
