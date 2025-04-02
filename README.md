# My Portfolio App Infrastructure (AWS CloudFormation)

This repository contains the infrastructure-as-code (IaC) for deploying my personal portfolio web application on AWS using modular **CloudFormation**, **Amazon ECS (with EC2)**, and **CodePipeline**.

---

## 🧱 Architecture Overview

- **ECS Cluster (EC2-based)** with Auto Scaling Group
- **Application Load Balancer** with public DNS
- **Amazon ECR** for Docker image storage
- **AWS CodePipeline + CodeBuild** for CI/CD
- **S3** for storing deployment artifacts
- **CloudFormation nested stacks** for modular deployment

---

## 📁 Folder Structure
infra/
├── VPC.yml
├── LoadBalancer.yml
├── AutoScalingGroup.yml
├── LaunchTemplate.yml
├── Service.yml
├── DeploymentPipeline.yml
└── MasterNestedStack.yml

deploy.sh 

# CLI script to deploy entire infrastructure

---

## 🛠 Deploy Instructions

> Run from root of this repo (ensure AWS CLI is configured)

```bash
chmod +x deploy.sh
./deploy.sh

Security
	•	No AWS secrets or access keys are committed
	•	GitHub OAuth token is securely stored via SSM Parameter Store (/github/token)
	•	IAM roles are scoped using least privilege

Related Repositories

📌 You can customize this to match your stack, but it’s professional, focused, and easy for recruiters to scan.

---

