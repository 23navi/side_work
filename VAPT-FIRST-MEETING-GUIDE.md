# VAPT First Meeting Internal Doc

## Purpose

This document is for the first meeting between the development team and the external VAPT testing team. It summarizes the application, technology stack, architecture, questions we should ask, and likely questions the testing team may ask us.

---

## Application Overview

ProjectY is a cloud-based IoT fleet data platform. It receives realtime data from proprietary IoT devices installed in vehicles, stores raw device data, processes analytics, and exposes dashboards for authorized users.

Main capabilities:
- Realtime vehicle/device data display
- Fleet dashboards and map-based visualization
- Analytics for idling, stop-and-go, driving behavior, trips, performance, speed distribution, and trace data
- Raw data download in controlled formats
- Multi-tenant user, vehicle, site, driver, and device management
- Controlled multi-user access through role-based permissions

---

## Top-Level Technology Stack

### Frontend
```
Framework:                React 19
Language:                 TypeScript
Build Tool:               Vite
Styling:                  Tailwind CSS
UI Components:            Radix UI
Routing:                  React Router
Data Fetching:            TanStack React Query
Forms and Validation:     React Hook Form + Zod
Maps:                     Mapbox GL JS
Charts:                   Recharts
Hosting:                  AWS S3 + CloudFront
```

### Backend API
```
Runtime:                  Bun
Language:                 TypeScript
Framework:                Hono
ORM:                      Drizzle ORM
Database:                 PostgreSQL RDS
Authentication:           JWT signed HTTP-only cookies and Bearer token support
Password Hashing:         bcryptjs
Metrics:                  Prometheus
Deployment:               AWS ECS Fargate behind ALB
```

### IoT and Data Pipeline
```
TCP Listeners:            Go services on AWS ECS
Device Protocols:         BStech, ITriangle, Teltonika 2G, Teltonika 4G
Queue:                    RabbitMQ
Realtime Store:           Redis
Raw Data DB:              PostgreSQL RDS
Analytics Jobs:           Go ECS cron tasks
Orchestration:            AWS Lambda + EventBridge
Cold Storage:             AWS S3
Archival:                 Nightly Go archiver ECS task
```

---

## High-Level Architecture

```
IoT Devices
  -> Public TCP Listener NLB
  -> Go parser services
  -> RabbitMQ queues
  -> Raw DB writer -> Raw Packet PostgreSQL RDS
  -> Realtime writer -> Redis realtime cache
  -> Backend API -> Frontend dashboards

Raw Packet PostgreSQL RDS
  -> Analytics ECS cron jobs
  -> Analysis PostgreSQL RDS
  -> Backend API -> Analytics dashboards

Raw Packet PostgreSQL RDS
  -> Nightly archiver
  -> S3 raw-data archive
  -> Raw DB table rotation and purge

Frontend
  -> CloudFront + S3
  -> Backend API over HTTPS
```

---

## Questions We Should Ask the Testing Team

1. **Scope**
   - Will testing cover frontend, backend API, IoT TCP listeners, AWS infrastructure, or all of them?
   - Is source-code review included, or is this deployed-environment testing only?
   - Are staging and production both in scope, or staging only?

2. **Testing Model**
   - Will this be black-box, gray-box, or white-box testing?
   - Do you need architecture diagrams, API route lists, sample packets, test credentials, or repository access?

3. **Testing Safety**
   - Can automated scanners, fuzzers, TCP packet replay, and load tests be used?
   - What request-rate and TCP connection limits should we agree on?
   - Are destructive tests allowed on staging?
   - Are there blackout windows where testing must not run?

4. **IoT Listener Testing**
   - Will you test public TCP listener ports directly?
   - Do you need valid sample packets for BStech, ITriangle, Teltonika 2G, and Teltonika 4G?
   - Will you test spoofed IMEIs, replayed packets, malformed packets, and connection exhaustion?

5. **Access Requirements**
   - What user roles do you need test accounts for?
   - Do you need separate tenant/subtenant test data for IDOR and tenant-isolation testing?
   - Do you require database access, or should testing be API-only?
   - Do you need read-only AWS access for infrastructure review?

6. **Data Handling**
   - Should testing use synthetic data only?
   - Can testers view GPS coordinates, raw device data, and driver assignments?
   - How should downloaded data, screenshots, logs, and reports be stored and destroyed after testing?

7. **Reporting**
   - Will findings be scored using CVSS?
   - Will findings be mapped to OWASP Top 10 and cloud/IAM categories?
   - Should Critical and High findings be reported immediately?
   - Is retesting included after fixes?

---

## Expected Questions From Testing Team and Suggested Answers

### 1. What does the application do?
It is an IoT fleet data platform. It receives realtime GPS/device packets from vehicle devices, stores raw data, processes analytics, and provides authenticated dashboards and reports for authorized users.

### 2. What are the main public attack surfaces?
- Frontend web application
- Backend API under `/v1`
- API health/metrics endpoints
- Public IoT TCP listener ports
- CloudFront/S3 frontend hosting
- ALB/NLB endpoints

### 3. What authentication mechanism is used?
JWT-based authentication. The backend accepts an access token from an HTTP-only signed cookie or from an `Authorization: Bearer` header. Login sets signed cookies and also returns tokens in JSON.

### 4. What roles exist?
Backend roles are:
```
superadmin, admin, manager, driver, mastermechanic, mechanic
```
Frontend documentation should be aligned because it currently lists fewer roles than the backend.

### 5. Is the API versioned?
Yes, the current API is mounted under `/v1`. There is no formal deprecation policy visible in code.

### 6. Is HTTPS enforced?
The backend API is deployed behind an AWS ALB with ACM certificate and HTTP redirect enabled. Direct ECS task exposure should still be verified because public IP assignment and service security group rules exist in the infra code. IoT listener ports are raw TCP, not HTTPS.

### 7. What is the CORS policy?
CORS origins come from the `CORS_ORIGINS` environment variable, parsed as a comma-separated list of URLs. Credentials are enabled.

### 8. Is rate limiting implemented?
Yes, unauthenticated API requests are limited to 60 requests per minute by forwarded IP. Authenticated requests are currently skipped. Dedicated login throttling is not visible.

### 9. How are passwords stored?
Passwords are hashed with `bcryptjs` using cost factor `10`.

### 10. What databases and storage are used?
- PostgreSQL RDS for raw data
- PostgreSQL RDS for application and analytics data
- Redis for realtime vehicle state
- RabbitMQ for ingestion buffering
- S3 for raw-data archive and cron job files

### 11. Is database encryption enabled?
This cannot be confirmed from application code alone. It should be verified directly in AWS RDS, Redis, RabbitMQ, and S3 configuration.

### 12. Are API calls audited?
The API has operational request logging with request ID, method, path, status, elapsed time, and user ID or forwarded IP. A full compliance-grade before/after audit trail for changes is not visible.

### 13. What IoT protocols or ports are exposed?
Known listener ports:
```
2222  Teltonika 4G
5555  BStech
6666  ITriangle
9999  Teltonika 2G
```
There is also a monitor/metrics HTTP port configured by environment variable.

### 14. Can testers replay or spoof device packets?
This should be agreed during kickoff. For staging, we can provide sample packets and synthetic device IMEIs if direct IoT pipeline testing is in scope.

### 15. What is the raw data retention policy?
Raw data is rotated nightly. Data is archived to S3, then the archived raw DB table is dropped after successful backup in staging/production. S3 archive objects transition to lower-cost storage classes over time and do not currently have a final expiration configured.

### 16. What third-party services are used?
- AWS: ECS, ALB/NLB, S3, RDS, Lambda, EventBridge, CloudFront, Route53, ACM, CloudWatch, SES
- Mapbox for frontend maps
- RabbitMQ and Redis for backend data flow

### 17. Are there known areas we want reviewed carefully?
Yes:
- JWT/session handling and CSRF
- CORS with credentials
- Tenant isolation and IDOR
- Superadmin-only support operations
- Raw data download authorization
- IoT TCP packet validation and replay/spoofing
- AWS IAM least privilege
- Public ECS/NLB exposure
- Secrets management and environment variables
- Redis TLS certificate verification

---

## Access We Should Prepare Before the Meeting

- Staging frontend URL
- Staging backend API base URL
- Public TCP listener endpoint and allowed ports, if in scope
- Test users for all roles
- Test tenant, subtenant, vehicles, sites, drivers, and sample data
- Sample valid and invalid IoT packets
- Sanitized API route list or Postman/Bruno collection
- Sanitized architecture diagram
- Agreed testing window and escalation contact
- Rules for destructive testing and load testing

---

## First-Meeting Outcome Checklist

- [ ] Scope confirmed
- [ ] Environment confirmed
- [ ] Testing model confirmed
- [ ] Credentials and data requirements confirmed
- [ ] TCP listener testing decision confirmed
- [ ] AWS review decision confirmed
- [ ] Rate/load limits agreed
- [ ] Blackout windows agreed
- [ ] Reporting format agreed
- [ ] Critical finding communication channel agreed
- [ ] Retesting plan agreed
