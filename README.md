<!-- @format -->

# Full Portfolio Infrastructure on AWS (ECS + Bridge Mode)

This project demonstrates a complete end-to-end **AWS-based infrastructure** for deploying a personal full-stack portfolio application using **Infrastructure as Code (IaC)** with CloudFormation and modular nested stacks.

> Built to showcase DevOps best practices: IaC, CI/CD, Observability, Security, Containerization, and Scalability.

---

## Architecture Overview

```
Route 53 (DNS)
      ↓
    ALB (HTTPS)
      ↓
+----------------------------+
|    Amazon ECS (EC2)       |
|  Network Mode: bridge     |
|  One EC2 running all tasks|
+----------------------------+
      ↓
 [React Frontend]
 [Node.js Backend API]
 [Static Project Demos]
```

---

## Core Components

| Stack                                | Description                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **VPCStack**                         | Creates a VPC with public subnets, route tables, and optional flow logs.                        |
| **LoadBalancerStack**                | Internet-facing ALB with SSL termination and listener rules for routing subdomains to services. |
| **LaunchTemplateStack**              | EC2 Launch Template for ECS instances using Amazon Linux 2023 ECS-optimized AMI.                |
| **ServiceStack**                     | Deploys the main portfolio application (React) containerized via ECS.                           |
| **Project1/2/FullStackServiceStack** | Additional projects (demo sites and fullstack app with React + Node.js).                        |
| **AutoScalingStack**                 | Scales ECS instances based on CPU/memory utilization.                                           |
| **PipelineStack(s)**                 | Automates deployment with AWS CodePipeline and CodeBuild per project.                           |

---

## ECS Task Configuration (Bridge Mode)

- **NetworkMode**: `bridge`
- **LaunchType**: `EC2`
- **PortMappings**:
  - Portfolio: `HostPort 80 → ContainerPort 80`
  - Project 1: `HostPort 3000 → ContainerPort 3000`
  - Project 2: `HostPort 3001 → ContainerPort 3001`
  - Project 3 (frontend): `HostPort 3002 → ContainerPort 3002`
  - Project 3 (backend): `HostPort 4000 → ContainerPort 4000`

---

## Observability

- **CloudWatch Logs**:
  - Separate log group per ECS service/container
  - Centralized `/vpc/flowlogs` for network visibility
- **Flow Logs Enabled** on VPC level for ALL traffic (`TrafficType: ALL`)

---

## Security Best Practices

- EC2 instance uses **minimal IAM role** with:
  - `AmazonEC2ContainerServiceforEC2Role`
  - `CloudWatchAgentServerPolicy`
  - `AmazonSSMManagedInstanceCore`
- Security Groups:
  - ALB only allows `HTTP (80)` and `HTTPS (443)`
  - ECS EC2 only allows `HostPorts` used by ALB
  - ALB forwards traffic using listener rules with `host-header` conditions (e.g., `project1.lamounierdigital.com`)

---

## CI/CD (Per Project)

Each project uses a dedicated CI/CD pipeline via:

- **CodePipeline**: Triggered on commit to S3/ECR or CodeCommit
- **CodeBuild**: Builds Docker images and pushes to ECR
- **CloudFormation Deploy**: Updates ECS service on build completion

---

## Domains

| Domain                          | Service                  |
| ------------------------------- | ------------------------ |
| `lamounierdigital.com`          | Portfolio main site      |
| `project1.lamounierdigital.com` | Project 1 (demo site)    |
| `project2.lamounierdigital.com` | Project 2 (demo site)    |
| `project3.lamounierdigital.com` | Project 3 (frontend app) |
| `api.lamounierdigital.com`      | Project 3 (backend API)  |

---

## Cost Optimization

- All services run on a **single `t3.large` EC2 instance** using **bridge networking**, avoiding ENI limits.
- **No NAT Gateway** used (Node.js API exposed via ALB, not outbound NAT).
- Public subnet architecture with restricted access via **Security Groups** instead of private subnets.

---

## Status

- Modular CloudFormation Stacks
- CI/CD per project
- Logging and Monitoring enabled
- Secure ALB routing with SSL
- ECS Bridge Mode for cost-efficient task density

---

## Skills Demonstrated

- AWS CloudFormation (modular, reusable stacks)
- Amazon ECS (bridge mode, multi-container)
- Application Load Balancer (listener rules, HTTPS routing)
- Docker & ECR
- CodePipeline & CodeBuild (CI/CD)
- IAM & Security Groups
- CloudWatch Logs & VPC Flow Logs
- Cost-aware and scalable architecture design
