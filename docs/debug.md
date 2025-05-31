<!-- @format -->

# Add this section to your existing debug guide:

## Project Structure Issues

### Issue: ECS Service Template - Incorrect Cluster Import

**Location**: `templates/compute/ecs-service.yml:317`

**Problem**:

```yaml
# INCORRECT - This import doesn't exist
Cluster: !ImportValue
  Fn::Sub: "${Environment}-${ProjectName}-ECSCluster"
```

**Root Cause**: ECS cluster exports don't include ProjectName

**Solution**:

```yaml
# CORRECT - Use the actual export name from ecs-cluster.yml
Cluster: !ImportValue
  Fn::Sub: "ECSClusterName-${Environment}"
```

**Files to Update**:

- `templates/compute/ecs-service.yml` (line 317)
- Verify export name in `templates/compute/ecs-cluster.yml`

### Directory Structure Benefits

- ✅ **Clear separation**: Compute, networking, security in separate directories
- ✅ **Logical grouping**: Related templates together
- ✅ **Scalable**: Easy to add new categories
- ✅ **Maintainable**: Clear responsibility boundaries

## Multi-Project Architecture

### Design Decision: Shared ECS Cluster

- **Approach**: One ECS cluster serves 4 projects
- **Benefits**: Cost optimization, resource sharing
- **Services**: Portfolio, Project1, Project2, ProjectFullStack
- **Isolation**: Service-level isolation within shared cluster

### Project Service Pattern

Each project follows the same pattern:

```yaml
ProjectName: Portfolio | Project1 | Project2 | ProjectFullStack
ServiceName: {project}-service
ClusterImport: ECSClusterName-${Environment}  # Shared cluster
```

### Resource Naming Convention

- **Cluster**: `PortfolioCluster-dev` (shared)
- **Services**: `dev-Portfolio-portfolio-service`, `dev-Project1-project1-service`
- **Task Definitions**: `dev-Portfolio-task`, `dev-Project1-task`
- **Log Groups**: `/ecs/dev/Portfolio-primary-task`, `/ecs/dev/Project1-primary-task`
