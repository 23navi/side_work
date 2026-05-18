# Backend and Infrastructure VAPT Preparation Document

## Part 1: Critical Questions to Ask the VAPT Testing Team

### Scope and Testing Model
1. **Testing Type**
   - Will this be **Gray Box Testing** with architecture, source-code snippets, API docs, and test credentials?
   - Will this include **Black Box Testing** against public endpoints and TCP listener ports?
   - Should the team perform a separate **AWS configuration review** in addition to application testing?

2. **Systems in Scope**
   - Confirm whether the following repositories are in scope:
     - `webapp-server-staging` - Backend API server.
     - `raw-listener-main` - TCP listeners, packet parser, raw-data writer, realtime writer.
     - `cron-go-main` - Analytics cron and ECS task orchestrator.
     - `archiver-main` - Raw-data archival and table rotation job.
   - Are Raw Packet DB, Analysis DB, Redis realtime cache, RabbitMQ, S3 buckets, ECS, ALB/NLB, Lambda, EventBridge, Route53, ACM, CloudWatch, and ECR in scope?
   - Are staging and production both in scope, or staging only?
   - Are IoT device TCP ports in scope for packet fuzzing and malformed packet tests?

3. **Testing Environment**
   - Should VAPT be performed against a dedicated test environment, staging, or production?
   - Can automated vulnerability scanners, TCP fuzzers, and load/DoS simulation tools be used?
   - What are the safe limits for request rate, TCP connection count, and packet volume?
   - Are there blackout windows where testing must not run because devices, dashboards, or cron jobs are business critical?

### Access and Credentials
4. **User Accounts and API Access**
   - What test accounts should be created for each backend role: `superadmin`, `admin`, `manager`, `driver`, `mastermechanic`, `mechanic`?
   - Should testers receive API documentation, Hono route details, Postman/Bruno collections, or only application URLs?
   - Should testers receive JWT/cookie details or only normal login credentials?
   - Should testers be allowed to inspect `/metrics`, `/health-check`, and `/ready` endpoints?

5. **Device and TCP Listener Access**
   - Should testers receive sample device IMEIs and valid sample packets for BStech, ITriangle, Teltonika 2G, and Teltonika 4G?
   - Can testers connect directly to TCP ports `2222`, `5555`, `6666`, and `9999`?
   - Should testers be allowed to replay captured packets?
   - Should malformed packet, long packet, partial packet, reconnect storm, and idle connection tests be performed?
   - Is device identity verification expected to be tested, or are listeners currently accepting packets based only on packet content?

6. **Infrastructure Access**
   - Will testers need read-only AWS IAM access for configuration review?
   - Should testers receive sanitized CDK stack details, security group rules, IAM policies, ECS task definitions, ALB/NLB config, RDS config, Redis config, S3 config, and CloudWatch log retention settings?
   - Should testers be allowed to verify RDS/Redis/RabbitMQ network exposure directly?
   - Will container image scanning of ECR images be performed?

7. **Data and Database Access**
   - Should testers receive database read-only access, or should all testing be API-only?
   - Can testers view real vehicle data, GPS coordinates, driver assignments, raw packets, and analytics data?
   - Should test data be synthetic, masked, or production-derived?
   - What is the permitted data export scope for raw CSV/ZIP download testing?

### Threat Model and Testing Focus
8. **Backend Application Risks**
   - Should testing prioritize authentication bypass, JWT/session weaknesses, CSRF, CORS, RBAC, tenant isolation, IDOR, SQL injection, command injection, file download abuse, and API rate limits?
   - Should testers attempt cross-tenant access by changing `tenantId`, `subtenantId`, `vehicleId`, `imei`, `driverId`, and `jobId` values?
   - Should support/admin endpoints be tested for destructive operations such as analysis job deletion and user hard delete?

9. **IoT and Realtime Data Risks**
   - Should testers validate integrity of raw TCP packets before they enter RabbitMQ, Raw DB, Redis, and dashboards?
   - Should testers assess replay attacks, spoofed IMEIs, fake GPS points, timestamp manipulation, high-speed anomalies, and malformed binary payloads?
   - Should testing include poisoning realtime Redis values and checking frontend/API trust boundaries?

10. **Cloud and Supply Chain Risks**
    - Should testing include IAM least privilege, secrets management, public subnet exposure, public IP assignment, security group exposure, S3 bucket policy, object encryption, lifecycle, and logging?
    - Should testers check whether `.env` files or secrets are present in source repositories, Docker images, ECS environment variables, logs, or build artifacts?
    - Should testers review GitHub Actions, private module access, Docker build arguments, and dependency CVEs?

### Deliverables and Reporting
11. **Reporting Format**
    - Should findings use CVSS scoring and OWASP categories?
    - Should IoT-specific findings be classified separately from web/API findings?
    - Should AWS findings be grouped by service: IAM, ECS, ELB, RDS, Redis, S3, Lambda, EventBridge, CloudWatch?
    - Should every finding include reproduction steps, affected endpoint/port, evidence, impact, and remediation guidance?

12. **Retesting and Remediation**
    - Will retesting be included after fixes?
    - How quickly should Critical or High findings be reported during testing?
    - Should the test team provide a prioritized remediation roadmap?
    - Should secrets exposure be handled through immediate private disclosure outside the final report?

---

## Part 2: Backend and Infrastructure Details to Provide to Testing Team

### System Overview

The system receives realtime GPS and telemetry data from proprietary IoT devices, stores raw packets securely, derives analytical data, serves dashboards through authenticated APIs, and allows authorized users to view, manage, export, and operate on data.

High-level flow:
```
IoT Devices
  -> Public TCP Listener NLB
  -> Go parser services
  -> RabbitMQ queues
  -> Raw DB writer -> Raw Packet PostgreSQL RDS
  -> Realtime writer -> Redis realtime cache
  -> API server -> Frontend dashboards

Raw Packet PostgreSQL RDS
  -> Analytics cron ECS task
  -> Analysis PostgreSQL RDS
  -> API server -> Analytics dashboards

Raw Packet PostgreSQL RDS
  -> Nightly archiver ECS task
  -> S3 raw-data archive
  -> Raw DB table rotation and purge
```

### Project Repositories

#### `webapp-server-staging`
```
Purpose:                  Backend API for frontend dashboards and admin workflows
Runtime:                  Bun
Language:                 TypeScript
Framework:                Hono 4.7.0
ORM:                      Drizzle ORM 0.39.3
Database Driver:          pg 8.20.0
Validation:               Zod 4.3.6
Auth:                     JWT signed cookies and Authorization bearer token support
Password Hashing:         bcryptjs
Realtime Store:           Redis via ioredis
Object Storage:           S3 via AWS SDK
Metrics:                  Prometheus via @hono/prometheus
Rate Limiting:            hono-rate-limiter
```

#### `raw-listener-main`
```
Purpose:                  TCP packet ingestion, parsing, queue publishing, raw DB writing, realtime cache writing
Runtime:                  Go
Go Version:               go.mod uses Go 1.23.0; Dockerfiles use Go 1.24.5 for listener services
HTTP Framework:           Fiber v3 beta for health/metrics services
Database Driver:          pgx v5
Queue:                    RabbitMQ via amqp091-go
Realtime Store:           Redis
Metrics:                  Prometheus client_golang
Device Protocols:         BStech, ITriangle, Teltonika 2G, Teltonika 4G
```

#### `cron-go-main`
```
Purpose:                  Scheduled analytics processing over raw data
Runtime:                  Go
Go Version:               1.23.0
Compute:                  Lambda orchestrator + ECS Fargate cron task
Storage:                  S3 job request bucket, Raw DB, Analysis/Webapp DB, S3 raw archive
AWS SDK:                  AWS SDK for Go v2
Analytics:                Realtime analysis, idling, stop-and-go, driver behavior, trips, trace data, distribution, fluctuation
```

#### `archiver-main`
```
Purpose:                  Nightly raw-data archival to S3 and raw DB table rotation/purge
Runtime:                  Go
Go Version:               go.mod uses Go 1.24
Database Driver:          pgx v5
Storage:                  S3 raw-data archive
Scheduler:                EventBridge ECS task
Email Alerts:             AWS SES via internal mailer
```

---

### Backend API Architecture

#### Public API Server
```
Framework:                Hono
Default Port:             3001
Deployment:               AWS ECS Fargate behind public Application Load Balancer
TLS:                      ACM certificate on ALB
HTTP Redirect:            HTTP redirected to HTTPS
Health Endpoints:         /health-check, /ready
Metrics Endpoint:         /metrics with Basic Auth
API Prefix:               /v1
```

#### API Middleware
```
Request ID:               x-request-id generated per request
Logging:                  Request logging middleware
CORS:                     Configured from CORS_ORIGINS, credentials enabled
Security Headers:         Hono secureHeaders
Compression:              Custom compression middleware
ETag:                     Hono etag middleware
Authentication:           setAuth middleware verifies signed JWT
Rate Limiting:            60 requests/minute for unauthenticated requests
Timeout:                  10 seconds
Global Error Handling:    HTTPException, PostgreSQL errors, generic 500 response
```

#### Authentication Flow
```
POST /v1/login
  - Validates email and password payload
  - Looks up user by email
  - Rejects deleted users and deleted tenants
  - Verifies bcrypt password hash
  - Issues accessToken and refreshToken
  - Sets HTTP-only signed cookies
  - Also returns tokens in JSON response

GET /v1/me
  - Requires valid JWT
  - Returns current user DTO without password

POST /v1/logout
  - Clears auth cookies
```

#### Cookie and JWT Details
```
Cookie Names:             accessToken, refreshToken
Cookie Signing:           Hono signed cookies using JWT_SECRET
JWT Signing:              Hono JWT using JWT_SECRET
Live Cookie Flags:        secure=true, httpOnly=true, sameSite=None
Development Flags:        secure=false, httpOnly=true, sameSite=Lax
Access Token Expiry:      30 days currently
Refresh Token Expiry:     5 minutes currently
Bearer Token Support:     Authorization header is also accepted
```

#### Backend Roles
```
superadmin:               Global access
admin:                    Tenant admin access
manager:                  Analytics/dashboard access
driver:                   Limited user role
mastermechanic:           Device/raw-data diagnostic access across tenants
mechanic:                 Mechanic/device support role
```

Role hierarchy in API code:
```
superadmin > admin > manager > driver > mastermechanic > mechanic
```

Analysis access roles:
```
superadmin, admin, manager, mechanic
```

Note: The backend includes a `manager` role. The frontend preparation document should be checked so role naming is consistent across VAPT materials.

---

### API Endpoints Overview

#### Health and Observability
```
GET    /health-check                            - Liveness health check
GET    /ready                                   - Readiness details including mode and commit ID
GET    /robots.txt                              - Disallow all robots
GET    /metrics                                 - Prometheus metrics, Basic Auth protected
```

#### Authentication
```
POST   /v1/login                                - Login and set auth cookies
POST   /v1/logout                               - Logout and clear cookies
GET    /v1/me                                   - Current user
```

#### Tenant and Subtenant Management
```
GET    /v1/tenants                              - List tenants
GET    /v1/tenants/:id                          - Get tenant details
POST   /v1/tenants                              - Create tenant
PATCH  /v1/tenants/:id                          - Update tenant
DELETE /v1/tenants/:id                          - Soft-delete tenant and related users/vehicles/subtenants

GET    /v1/subtenants                           - List subtenants
GET    /v1/subtenants/:id                       - Get subtenant details
POST   /v1/subtenants                           - Create subtenant
PATCH  /v1/subtenants/:id                       - Update subtenant
```

#### User Management
```
GET    /v1/users                                - List users with filtering and pagination
GET    /v1/users/:id                            - Get user
POST   /v1/users                                - Create user
PATCH  /v1/users/:id                            - Update user, role, email, password, reactivation
DELETE /v1/users/:id                            - Soft delete or hard delete with ?hard=true
```

Important behavior:
```
Unauthenticated user creation is allowed only with MASTER_PASSWORD as `secret`.
Passwords are hashed with bcrypt cost 10.
API responses use user DTOs that omit password.
```

#### Vehicle and Device Management
```
GET    /v1/vehicles                             - List vehicles
GET    /v1/vehicles/:id                         - Get vehicle
GET    /v1/vehicles/imeis                       - List IMEIs from realtime Redis
POST   /v1/vehicles                             - Create vehicle
PATCH  /v1/vehicles/:id                         - Update vehicle
DELETE /v1/vehicles/:id                         - Soft-delete vehicle

GET    /v1/vehicles/:id/settings                - Get vehicle settings
POST   /v1/vehicles/:id/settings                - Create settings
PATCH  /v1/vehicles/:id/settings                - Update settings
DELETE /v1/vehicles/:id/settings                - Delete settings
```

#### Vehicle Groups and Models
```
GET    /v1/vehicle-groups                       - List groups
POST   /v1/vehicle-groups                       - Create group
GET    /v1/vehicle-groups/:id                   - Get group
PATCH  /v1/vehicle-groups/:id                   - Update group
DELETE /v1/vehicle-groups/:id                   - Delete group
POST   /v1/vehicle-groups/:groupId/vehicle      - Add vehicle to group
DELETE /v1/vehicle-groups/:groupId/vehicle/:vehicleId - Remove vehicle from group

GET    /v1/vehicle-models                       - List models
GET    /v1/vehicle-models/:name/:tenantId       - Get model
POST   /v1/vehicle-models                       - Create model
PATCH  /v1/vehicle-models/:name/:tenantId       - Update model
DELETE /v1/vehicle-models/:name/:tenantId       - Delete model
```

#### Realtime Data
```
GET    /v1/realtime/tenants/:tenantId/vehicles  - Realtime status for tenant vehicles
GET    /v1/realtime/vehicles/:id                - Realtime status for one vehicle
```

#### Analytics and Dashboard Data
```
GET    /v1/performance/:type/:id                - Performance summary for vehicle or vehicle-group
GET    /v1/idling/index/:type/:id               - Idling analysis
GET    /v1/idling/points/:type/:id              - Idling map points
GET    /v1/behavior/index/:type/:id             - Driver behavior data
GET    /v1/behavior/points/:type/:id            - Driver behavior points
GET    /v1/behavior/accel-levels/:type/:id      - Acceleration/braking level distribution
GET    /v1/fluctuation/index/:type/:id          - Speed fluctuation data
GET    /v1/distribution/data/:type/:id          - Speed distribution data
GET    /v1/stopngo/index/:type/:id              - Stop-and-go data
GET    /v1/stopngo/points/:type/:id             - Stop-and-go points
GET    /v1/trips                                - Trip list
GET    /v1/trips/aggregate                      - Aggregated trip summary
GET    /v1/trips/aggregate/data                 - Aggregated trip data
GET    /v1/trips/points                         - Trip map points
GET    /v1/trips/behavior-points                - Trip behavior points
GET    /v1/trips/:id                            - Trip details
GET    /v1/trips/:id/trace                      - Trip trace
GET    /v1/trips/:id/data                       - Trip data
GET    /v1/trace-data/:type/:id                 - Trace data for vehicle or vehicle-group
```

Most analytics endpoints validate:
```
type:                     vehicle or vehicle-group
date range:               endDate after startDate
max range:                3 months
optional filters:         vehicle type, model, loading platform, driver, excluded vehicles, minute range
tenant isolation:         canGetVehicle checks requester tenant unless superadmin/mastermechanic
```

#### Sites and Driver Assignments
```
GET    /v1/sites                                - List sites/geofences
GET    /v1/sites/:id                            - Get site
GET    /v1/sites/:id/vehicles                   - Site-related vehicles
POST   /v1/sites                                - Create site polygon
PATCH  /v1/sites/:id                            - Update site
DELETE /v1/sites/:id                            - Delete site

GET    /v1/driver-vehicle-logs                  - List driver-vehicle assignments
GET    /v1/driver-vehicle-logs/:id              - Get assignment
POST   /v1/driver-vehicle-logs                  - Create assignment
PATCH  /v1/driver-vehicle-logs/:id              - Update assignment
```

#### Support and Raw Data
```
GET    /v1/support/analysis-jobs                - List analysis jobs, superadmin only
GET    /v1/support/analysis-jobs/:id/vehicles/:vehicleId - Get job for vehicle, superadmin only
POST   /v1/support/analysis-jobs/delete-job     - Delete analysis output for a job, superadmin only
GET    /v1/support/raw-data                     - Download raw data as CSV/ZIP or JSON diagnostic output
```

Raw data export behavior:
```
Query Params:              startDate, endDate, imei
Max Range:                 3 months
CSV/ZIP Download:          superadmin required
JSON Diagnostic Output:    mechanic-level access required and only for today's date
```

---

### Data Stores and Core Data Models

#### Raw Packet DB
```
Database:                 PostgreSQL RDS
Tables:                   RawDataCurrent, RawDataOld, RawDataArchive, template table
Fields:                   timestamp, actual/received timestamp, imei, speed, longitude, latitude
Purpose:                  Hot raw device data before analytics and archival
Rotation:                 Nightly table rotation by archiver job
```

#### Analysis/Webapp DB
```
Database:                 PostgreSQL RDS
ORM Schema Prefix:         webapp_*
Managed By:               Drizzle migrations
Major Entities:           tenant, subtenant, user, vehicle, vehicle_group, vehicle_model,
                          vehicle_settings, driver_vehicle_logs, site
Analytics Tables:         idling_analysis_data, idling_point,
                          driving_behavior_analysis_data, driving_behavior_point,
                          driving_behavior_accel_level, speed_fluctuation_data,
                          speed_distribution_data, trip, trip_trace, trip_data,
                          trip_idling_point, stopngo_point, stopngo_data,
                          analysis_job, trace_data
Geospatial Support:       PostGIS geometry points and polygons
```

#### Redis Realtime Store
```
Purpose:                  Current/recent realtime state per IMEI
Writers:                  raw-listener realtime service
Readers:                  API realtime endpoints
Transport:                TLS configured in clients
```

#### RabbitMQ
```
Purpose:                  Buffer parsed raw data between TCP parser and downstream processors
Queues:                   RAW_DATA_QUEUE_NAME, REALTIME_QUEUE_NAME
Producers:                Parser service
Consumers:                Raw DB writer service, realtime writer service
Ack Mode:                 Manual ack in workers
```

#### S3 Buckets
```
Raw Data Archive:         Stores archived raw data CSVs by IMEI/day
Cron Job Bucket:          Stores analytics job request JSON files under jobs/
Lifecycle:                Job bucket expires jobs after 365 days
Archive Lifecycle:        Transitions raw archive objects to IA/Glacier classes over time
```

---

### Raw Listener Architecture

#### Parser Service
```
Deployment:               ECS Fargate
External Access:          Public Network Load Balancer
Ports:
  2222                    Teltonika 4G binary listener
  5555                    BStech listener
  6666                    ITriangle listener
  9999                    Teltonika 2G listener
  MONITOR_PORT            Health and metrics HTTP service
```

Processing flow:
```
TCP connection accepted
  -> Packet accumulated and split by adapter
  -> Packet parsed into RawData
  -> Basic validation: IMEI present and timestamp year is current or previous year
  -> Published to RabbitMQ raw-data queue and realtime queue
```

#### Writer Service
```
Deployment:               ECS Fargate
Input:                    RabbitMQ raw-data queue
Output:                   Raw Packet PostgreSQL DB
Workers:                  4 consumer/batcher workers
Monitoring:               /health-check and /metrics
Metrics Auth:             Basic Auth using AUTH_SECRET; middleware order should be verified
```

#### Realtime Service
```
Deployment:               ECS Fargate
Input:                    RabbitMQ realtime queue
Output:                   Redis realtime cache
Workers:                  4 workers, sharded by IMEI modulo worker count
Monitoring:               /health-check and /metrics
Metrics Auth:             Basic Auth using AUTH_SECRET; middleware order should be verified
```

#### Monitor Endpoints
```
GET /                     Health check for NLB
GET /health-check          Health check
GET /metrics               Prometheus metrics, Basic Auth configured; middleware order should be verified
```

---

### Analytics Cron Architecture

#### Orchestrator
```
Compute:                  AWS Lambda custom Go runtime
Trigger:                  EventBridge cron schedule
Production Schedule:      00:50 UTC daily
Job Creation:             Uploads job request JSON to S3
Task Launch:              Starts ECS Fargate cron task
Permissions:              S3, ECS, EC2 subnet discovery, CloudWatch
```

#### Cron Task
```
Compute:                  ECS Fargate
CPU/Memory:               1024 CPU units / 8192 MiB
Inputs:                   JOB_BUCKET, JOB_KEY, Raw DB, Webapp DB, Raw Data Archive S3
Job Request Types:        insert-only, replace
Default Range:            Previous UTC day
Default Vehicle Scope:    All vehicles if request vehicle list is empty
Output:                   Analysis tables in Webapp/Analysis DB
```

Analytics modules:
```
Idling
Stop and Go
Driver Behavior
Trips
Trace Data
Speed Distribution
Speed Fluctuation
Performance summaries
```

---

### Archiver Architecture

```
Compute:                  ECS Fargate task
Trigger:                  EventBridge cron schedule
Production Schedule:      23:50 UTC daily
Primary Function:         Archive raw data to S3 and rotate Raw DB tables
Archive Format:           CSV files grouped by IMEI and day
Failure Alerting:         Email to DEV_MAILS via SES
```

Table rotation flow:
```
RawDataOld -> RawDataArchive
RawDataCurrent -> RawDataOld
Create new RawDataCurrent from template
Archive RawDataArchive date range to S3
Drop RawDataArchive after successful backup in staging/production
```

---

### AWS Infrastructure

#### Webapp API
```
ECS:                      Fargate service
Load Balancer:            Public ALB
TLS:                      ACM certificate
DNS:                      Route53 public hosted zone
HTTP:                     Redirected to HTTPS
Task Public IP:           Enabled
Service SG Ingress:       80, 443, 3001 from 0.0.0.0/0
CloudWatch Logs:          1 week retention
```

#### Raw Listener
```
ECS:                      Fargate services for parser, writer, realtime
Load Balancer:            Public NLB for parser TCP ports
DNS:                      Route53 A record to NLB
Task Public IP:           Enabled
Cloud Map:                Internal namespace pjy-listener-internal-{environment}
CloudWatch Logs:          1 week retention
Parser Desired Count:     staging=2, prod=1
Writer Desired Count:     staging=2, prod=1
Realtime Desired Count:   1
```

#### Cron and Archiver
```
Cron Orchestrator:        Lambda + EventBridge
Cron Processor:           ECS Fargate task
Archiver:                 EventBridge + ECS Fargate task
S3 Job Bucket:            pjy-comm-cron-jobs-{environment}
S3 Raw Archive Bucket:    pjy-comm-raw-data-{environment}
CloudWatch Logs:          Cron 1 month, archiver 1 week, orchestrator 1 month
```

#### IAM and Secrets
Current infrastructure code uses broad managed policies in several places:
```
AmazonS3FullAccess
AmazonSESFullAccess
AmazonSNSFullAccess
AmazonSQSFullAccess
AmazonECS_FullAccess
AmazonEC2FullAccess
CloudWatchFullAccessV2
```

Sensitive configuration is currently supplied through environment variables:
```
DB_URL, RAW_DB_URL, WEBAPP_DB_URL, REALTIME_DB_URL, REDIS_URL,
MQ_URL, MQ_USERNAME, MQ_PASSWORD,
JWT_SECRET, MASTER_PASSWORD, AUTH_SECRET,
AWS_ACCESS_KEY, AWS_SECRET_KEY,
RAW_DATA_BUCKET, RAW_DATA_ARCHIVE_BUCKET,
JOB_BUCKET, JOB_KEY
```

---

### Security Controls Already Present

#### Application Controls
```
HTTP-only signed auth cookies
JWT verification middleware
Role-based guards through requiresAuth and requiresRole
Tenant and vehicle access checks in service helpers
Zod validation for route params, query params, and JSON bodies
Drizzle query builder for database queries
Generic error responses for internal server errors
Secure headers middleware on Hono API
Request timeouts and PostgreSQL statement timeouts
Unauthenticated API rate limit of 60 requests/minute
Prometheus metrics protected by Basic Auth on the API server; raw-listener metrics protection should be verified
```

#### Data Controls
```
Password hashes with bcrypt
Soft-delete flags for users, tenants, subtenants, and vehicles
Raw data export range limit of 3 months
JSON raw-data diagnostic output limited to today's data
Analysis job deletion restricted to superadmin
```

#### Infrastructure Controls
```
HTTPS enforced at API ALB
Private S3 access should be verified in AWS
S3 lifecycle policies configured for archive/job buckets
CloudWatch logging configured for deployed services
ECS circuit breaker enabled on major services
Health checks configured for API and listener target groups
```

---

## Part 3: Internal Pre-VAPT Remediation Checklist

These items should be reviewed before sharing source code, Docker images, AWS access, or environment details with the external VAPT team.

### Secrets and Source Hygiene
- [ ] Revoke and remove the exposed GitHub personal access token found in repository README files.
- [ ] Confirm whether `.env`, `.env.staging`, `.env.production`, and `.env.development` files contain real secrets. If yes, remove from repos and rotate affected secrets.
- [ ] Update `.gitignore` files to ignore `.env*` files, except safe `.env.example` templates.
- [ ] Create sanitized `.env.example` files containing variable names only.
- [ ] Check git history for committed secrets and rotate anything that was ever committed.
- [ ] Ensure Docker images do not include `.env` files or secrets copied at build time.
- [ ] Replace static AWS access keys in app environments with ECS task roles or Secrets Manager/SSM references where possible.

### Authentication and Session Hardening
- [ ] Reduce access token lifetime from 30 days to a production-appropriate value.
- [ ] Decide whether refresh token flow is required. Currently refresh token expires faster than access token and no refresh endpoint is visible.
- [ ] Avoid returning accessToken and refreshToken in JSON if cookie-based auth is the intended browser flow.
- [ ] Add CSRF protection or a documented SameSite/CORS strategy for cookie-authenticated state-changing requests.
- [ ] Confirm `JWT_SECRET`, `MASTER_PASSWORD`, and `AUTH_SECRET` are strong, unique per environment, and rotated.
- [ ] Add login-specific rate limiting and account lockout/throttling.
- [ ] Review unauthenticated user creation guarded by `MASTER_PASSWORD`.

### Authorization and Tenant Isolation
- [ ] Test every endpoint with cross-tenant `tenantId`, `subtenantId`, `vehicleId`, `imei`, `driverId`, and `jobId`.
- [ ] Review `mastermechanic` tenant bypass behavior for vehicle/raw-data access.
- [ ] Review `mechanic` behavior in tenant resolution and analysis access roles.
- [ ] Confirm frontend and backend role lists match, especially the backend `manager` role.
- [ ] Confirm destructive support endpoints require intended privileges only.

### IoT Listener Hardening
- [ ] Confirm whether device authentication is required at the TCP protocol layer.
- [ ] Document accepted packet formats and expected replay protections.
- [ ] Add or verify connection limits, read deadlines, maximum packet size enforcement, and malformed packet handling.
- [ ] Avoid logging full raw packets if they contain sensitive data.
- [ ] Confirm listener ports that should be public are the only public ports.
- [ ] Decide whether TCP traffic requires TLS, VPN, IP allowlisting, or protocol-level signing.

### Cloud and Infrastructure Hardening
- [ ] Replace broad AWS managed policies with least-privilege IAM policies.
- [ ] Review public subnet and `assignPublicIp: true` usage for ECS services.
- [ ] Restrict ECS service security groups so backend tasks are reachable only from their load balancers or required internal services.
- [ ] Review public NLB exposure for parser monitor/metrics port.
- [ ] Ensure RDS, Redis, and RabbitMQ are not publicly accessible.
- [ ] Verify RDS encryption at rest, backup retention, deletion protection, and audit/logging settings.
- [ ] Verify Redis TLS configuration and certificate verification. Current clients disable certificate verification in places.
- [ ] Verify raw-listener `/metrics` route protection. The Fiber route currently lists the Prometheus handler before Basic Auth middleware.
- [ ] Verify S3 bucket encryption, block public access, object ownership, bucket policies, access logs, and lifecycle policies.
- [ ] Increase production CloudWatch log retention if required by compliance.
- [ ] Run dependency and container image scans for Go, Bun, Alpine, and Docker base images.

---

## Part 4: Recommended VAPT Focus Areas

### Backend API
- [ ] Authentication bypass and JWT tampering
- [ ] CSRF against cookie-authenticated POST/PATCH/DELETE endpoints
- [ ] CORS misconfiguration with credentials
- [ ] IDOR and tenant isolation bypass
- [ ] RBAC bypass across all six backend roles
- [ ] SQL injection and ORM misuse
- [ ] NoSQL/Redis key abuse through IMEI or vehicle IDs
- [ ] Raw data export authorization and bulk-download abuse
- [ ] Support endpoint destructive action abuse
- [ ] Rate limiting and brute-force login testing
- [ ] Error handling and sensitive data leakage

### IoT and Realtime Pipeline
- [ ] TCP listener fuzzing
- [ ] Packet replay and spoofed IMEI testing
- [ ] Malformed, partial, oversized, and binary payload handling
- [ ] Connection exhaustion and idle connection behavior
- [ ] RabbitMQ queue flooding and backpressure behavior
- [ ] Redis realtime data poisoning
- [ ] Raw DB ingestion integrity
- [ ] Logs containing raw packets or sensitive device data

### Analytics and Archival Jobs
- [ ] S3 job request tampering
- [ ] ECS task override abuse
- [ ] Analysis job authorization and deletion controls
- [ ] Raw archive object exposure
- [ ] Table rotation failure and recovery behavior
- [ ] CSV/ZIP generation safety
- [ ] Background job observability and alerting

### AWS Infrastructure
- [ ] IAM privilege escalation and least privilege review
- [ ] Public IP and public subnet exposure
- [ ] ALB/NLB TLS and listener configuration
- [ ] Security group ingress/egress scope
- [ ] RDS network access, encryption, backup, and audit logging
- [ ] Redis/RabbitMQ network exposure and TLS settings
- [ ] S3 public access, encryption, lifecycle, and logging
- [ ] ECS task definition secret exposure
- [ ] Container image vulnerability scan
- [ ] CloudWatch logs sensitive data exposure

---

## Summary

**Total Backend Projects**: 4

**Core Backend Stack**:
- Bun + TypeScript + Hono API server
- Go TCP listeners, writers, realtime processors, analytics cron, and archiver
- PostgreSQL RDS for raw and analytical data
- Redis for realtime vehicle state
- RabbitMQ for ingestion buffering
- AWS ECS Fargate, Lambda, EventBridge, S3, ALB/NLB, Route53, ACM, CloudWatch

**Key Attack Surface**:
- Public API server with cookie/JWT authentication
- Public TCP listener ports for IoT devices
- Multi-tenant authorization boundaries
- Raw data CSV/ZIP export
- Superadmin support endpoints
- Background analytics and archival jobs
- AWS IAM, ECS task definitions, security groups, S3 buckets, and secrets handling

**Most Important Pre-VAPT Actions**:
- Revoke/remove exposed credentials.
- Remove committed `.env` secrets and sanitize shared config.
- Verify Docker images do not contain secrets.
- Tighten IAM and network exposure where feasible.
- Prepare test users, sample packets, and synthetic data for controlled testing.
