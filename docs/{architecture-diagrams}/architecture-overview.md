<!-- @format -->

# Infrastructure Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Route 53 DNS                                │
│           (lamounierdigital.com)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Application Load Balancer                     │
│              (SSL Termination)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   VPC (Environment-specific)                │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Public Subnet 1   │   Public Subnet 2   │         │   │
│  │                     │                     │         │   │
│  │  ┌─────────────┐    │  ┌─────────────┐    │         │   │
│  │  │ECS Instance │    │  │ECS Instance │    │         │   │
│  │  │             │    │  │             │    │         │   │
│  │  │┌───────────┐│    │  │┌───────────┐│    │         │   │
│  │  ││Container  ││    │  ││Container  ││    │         │   │
│  │  ││(Portfolio)││    │  ││(Project1) ││    │         │   │
│  │  │└───────────┘│    │  │└───────────┘│    │         │   │
│  │  └─────────────┘    │  └─────────────┘    │         │   │
│  └─────────────────────┴─────────────────────┴─────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Template Relationships

```
main.yml
├── core/vpc.yml                    (Foundation)
├── security/ecs-roles.yml          (IAM Permissions)
├── networking/
│   ├── ssl-certificate.yml         (HTTPS)
│   └── application-load-balancer.yml (Traffic Distribution)
├── compute/
│   ├── ecs-cluster.yml             (Container Orchestration)
│   ├── launch-template.yml         (EC2 Configuration)
│   ├── auto-scaling-group.yml      (Instance Management)
│   └── ecs-service.yml             (Application Deployment)
└── pipelines/ci-cd-pipeline.yml    (Deployment Automation)
```

## DNS Architecture

```
Development Environment:
- dev.lamounierdigital.com → Portfolio
- dev.www.lamounierdigital.com → Portfolio
- dev.project1.lamounierdigital.com → Project1
- dev.api.lamounierdigital.com → Backend

Production Environment:
- lamounierdigital.com → Portfolio
- www.lamounierdigital.com → Portfolio
- project1.lamounierdigital.com → Project1
- api.lamounierdigital.com → Backend
```

## Pipeline Architecture

```
Development Environment:
├── Portfolio-dev-Pipeline → develop branch → auto-trigger
├── Project1-dev-Pipeline → develop branch → auto-trigger
└── No approvals, fast builds

Production Environment:
├── Portfolio-prod-Pipeline → main branch → manual trigger → approval → deploy
├── Project1-prod-Pipeline → main branch → manual trigger → approval → deploy
└── Required approvals, large compute, sequential deployments
```
