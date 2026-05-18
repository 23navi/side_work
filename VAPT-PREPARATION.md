# VAPT (Vulnerability Assessment and Penetration Testing) Preparation Document

## Part 1: Critical Questions to Ask the VAPT Testing Team

### Scope & Testing Model
1. **Testing Type**
   - Is this **Gray Box Testing** (testers have access to documentation, architecture diagrams, and credentials) or **Black Box Testing** (external reconnaissance only)?
   - Or hybrid approach combining both?

2. **Scope Clarification**
   - Will testing cover **Frontend application only**, or also **Backend API**, and **Infrastructure (AWS)**?
   - Are there specific components excluded from testing?
   - Do you want testing across **staging and production environments**, or staging only?

3. **Testing Environment**
   - Should testing be done against a dedicated **test/isolated environment** or against staging/production?
   - Can testers use **automated scanning tools** during testing?

### Access & Credentials
4. **Access Requirements**
   - Will testers require **test user accounts** with different roles (superadmin, admin, driver, mechanic, mastermechanic)?
   - Do testers need **backend API documentation** (Hono framework endpoints, authentication mechanism)?
   - Do testers need **AWS infrastructure details** (CDK stack, S3 bucket configs, CloudFront distribution)?
   - Will testers require **VPN/network access** or **direct internet access** to the application?
   - Do testers need **database access** or API-only access?

5. **Source Code Access**
   - Will the testing team need **source code repository access** or just deployed application?
   - Should **environment configuration details** be shared (API endpoints, third-party service keys)?

### Threat Model & Testing Focus
6. **Priority Areas**
   - Are there specific **compliance requirements** (GDPR, HIPAA, SOC2, PCI-DSS)?
   - Should testing prioritize **authentication/authorization mechanisms**?
   - What's the **priority of data protection** (encryption, data handling)?
   - Are there specific **third-party integrations** requiring special attention (Mapbox, RPC client)?

7. **IoT/Real-time Considerations**
   - Since this handles real-time IoT data, should testing include **real-time data flow security**?
   - Are there concerns about **man-in-the-middle attacks** on the WebSocket/HTTP connections?
   - Should **API rate limiting and DoS protection** be tested?

### Deliverables & Reporting
8. **Testing Approach & Timeline**
   - What's the **duration** of the VAPT engagement (1 week, 1 month, ongoing)?
   - Will this be **active intrusive testing** or **passive vulnerability scanning**?
   - Will testers perform **both automated and manual testing**?

9. **Reporting & Remediation**
   - What format should **findings be reported** (OWASP Top 10 categories, CVSS scoring)?
   - Should testers provide **remediation recommendations** with each finding?
   - Do you want **re-testing after fixes** are implemented?
   - Should vulnerabilities be **categorized by severity** (Critical, High, Medium, Low)?

### Data & Sensitive Information
10. **Test Data Handling**
    - Should testers use **production data** or test data only?
    - Are there restrictions on **what data can be viewed/downloaded** during testing?
    - How should **data be handled** after testing is complete?

11. **Communication & Notifications**
    - Who is the **primary point of contact**?
    - Should findings be reported **immediately upon discovery** or compiled at the end?
    - Are there **blackout periods** when testing shouldn't occur?

---

## Part 2: Application Details to Provide to Testing Team

### Frontend Technology Stack

#### Core Frameworks & Libraries
```
Frontend Framework:        React 19.0.0 (Latest)
Build Tool:               Vite 6.1.0
Language:                 TypeScript 5.9.2 (Strict Mode enabled)
Runtime:                  Node.js (ESNext module support)
Package Manager:          Bun/pnpm
```

#### UI & Styling
```
UI Component Library:      Radix UI (headless components)
  - Dialog, Alert Dialog, Tabs, Select, Popover, etc.
CSS Framework:            Tailwind CSS 3.4.17
CSS-in-JS:                Class Variance Authority (CVA)
Icon Library:             Lucide React 0.475.0
Toast/Notifications:      Sonner 2.0.7
Animations:               Tailwind CSS Animate
```

#### Data Management & API
```
HTTP Client:              Ky 1.7.5 (Lightweight fetch wrapper)
RPC Client:               Hono Client (TypeScript-first)
Server Communication:     REST API with RPC pattern
State Management:         React Query (TanStack) 5.66.5
  - Query DevTools included (5.66.5)
Form Management:          React Hook Form 7.54.2
Form Validation:          Zod 3.24.2 (Schema validation)
Resolver:                 @hookform/resolvers 3.10.0
```

#### Maps & Geolocation
```
Mapping Library:          Mapbox GL JS 3.14.0
Map Drawing:              @mapbox/mapbox-gl-draw 1.5.0
Geospatial Utils:         @turf/square-grid 7.2.0
Coordinate Parsing:       Custom parse-lat-long library
```

#### Utilities & UI Enhancements
```
Routing:                  React Router 7.1.5
Theming:                  Next Themes 0.4.6
Date Handling:            Date-fns 4.1.0
Debouncing:               Use-debounce 10.0.5
Date Picker:              React Day Picker 8.10.1
Charts:                   Recharts 2.15.4
Environment Vars:         Dotenv 16.4.7
Classname Utilities:      clsx 2.1.1, Tailwind Merge 3.0.1
Command Palette:          cmdk 1.0.0
```

#### Development Tools
```
TypeScript Compiler:      TypeScript 5.9.2 (strict: true)
Linting:                  ESLint 9.20.1
  - TypeScript ESLint 8.24.1
  - React Hooks Plugin 5.1.0
  - React Refresh Plugin 0.4.19
  - Query Plugin 5.66.1
Code Formatting:          Prettier 3.5.1 + Tailwind Plugin
SVG Handling:             @svgr/webpack 8.1.0, vite-plugin-svgr 4.3.0
Build Optimization:       @vitejs/plugin-react-swc 3.8.0
Git Hooks:                Lint-staged 15.4.3
```

---

### Application Architecture

#### Route Structure (18+ Pages)
**Public Routes:**
- `/login` - Authentication page

**Protected Routes (Authenticated Users Only):**

**Live Dashboard:**
- `/entire-status` - Fleet-wide status overview
- `/live-trip-monitoring` - Real-time trip tracking

**Detail Analysis:**
- `/performance` - Vehicle/fleet performance analytics
- `/vehicle-idling` - Idling time analysis
- `/driving-behaviour` - Driver behavior analytics
- `/trip-history` - Historical trip data
- `/trip-efficiency` - Route efficiency analysis

**Settings/Management:**
- `/tenant-management` - Multi-tenant administration (SuperAdmin only)
- `/user-management` - User CRUD operations (SuperAdmin/Admin)
- `/vehicle` - Vehicle/Device management
- `/site` - Site/Location management

**Support/Maintenance:**
- `/raw-data-download` - Data export (SuperAdmin)
- `/job-analysis` - Background job monitoring (SuperAdmin)
- `/device-health-check` - Device diagnostics (Admin+)

**Other:**
- `/` - Home/Notification page
- `/notification` - Notification center
- `*` - 404 Not Found page

#### Role-Based Access Control (RBAC)

**User Roles:**
1. **superadmin** - Full system access
2. **admin** - Dashboard and user management
3. **mechanic** - Device health checks only
4. **mastermechanic** - Device health checks and diagnostics
5. **driver** - Limited viewing permissions

**Access Pattern:**
```
restrictedRoles: ["driver", "mechanic", "mastermechanic"]
↓
Drivers and mechanics cannot access: Entire Fleet Status, Live Trip Monitoring, 
Performance, Vehicle Idling, Driving Behaviour, Trip History, Trip Efficiency, 
Device/Vehicle Management, Site Management
```

---

### Authentication & Session Management

#### Authentication Flow
1. **Login Page** (`/login`)
   - Email validation (RFC 5322 standard)
   - Password requirements:
     - Minimum 8 characters
     - Must contain at least 1 number
     - Must contain letters

2. **Session Management**
   - User session stored via `SessionProvider` context
   - Session state: `authed`, `unauthed`, `loading`
   - Session data fetched from `/v1/me` endpoint
   - Query caching with React Query (staleTime: Infinity)

3. **Protected Routes**
   - `RequireAuth` middleware wraps all authenticated routes
   - Auto-redirect to login on session expiration
   - Role-based route guarding via `RoleGuard` component
   - Forbidden page for unauthorized access

#### API Communication
```
API Client:     Hono client with credentials: "include" (cookies)
Authentication: Cookie-based session (HTTP-only cookies recommended)
Base URL:       Configurable via VITE_SERVER_URL environment variable
Request Format: REST API with RPC pattern
Response Format: JSON
Error Handling: Invalid credentials return HTTP error with message
```

---

### API Endpoints Overview

#### Core Endpoints
```
GET    /v1/me                                    - Current user info
POST   /v1/login                                 - User login
POST   /v1/logout                                - User logout
```

#### User Management
```
GET    /v1/users                                 - List users
POST   /v1/users                                 - Create user
PATCH  /v1/users/:id                             - Update user
DELETE /v1/users/:id                             - Delete user
```

#### Tenant Management
```
GET    /v1/tenants                               - List tenants
POST   /v1/tenants                               - Create tenant
GET    /v1/tenants/:id                           - Get tenant details
PATCH  /v1/tenants/:id                           - Update tenant
DELETE /v1/tenants/:id                           - Delete tenant
```

#### Sub-Tenants
```
GET    /v1/subtenants                            - List sub-tenants
POST   /v1/subtenants                            - Create sub-tenant
GET    /v1/subtenants/:id                        - Get sub-tenant
PATCH  /v1/subtenants/:id                        - Update sub-tenant
```

#### Vehicle Management
```
GET    /v1/vehicles                              - List vehicles
POST   /v1/vehicles                              - Add vehicle
GET    /v1/vehicles/:id                          - Get vehicle details
PATCH  /v1/vehicles/:id                          - Update vehicle
DELETE /v1/vehicles/:id                          - Delete vehicle

GET    /v1/vehicle-types                         - List vehicle types (HCV, MCV, SCV, Passenger)
GET    /v1/vehicle-models                        - List vehicle models
GET    /v1/vehicle-loading-platforms             - List loading platforms (Box, Tanker, Bulker, etc.)
```

#### Vehicle Groups
```
GET    /v1/vehicle-groups                        - List vehicle groups
POST   /v1/vehicle-groups                        - Create vehicle group
GET    /v1/vehicle-groups/:id                    - Get group details
PATCH  /v1/vehicle-groups/:id                    - Update group
DELETE /v1/vehicle-groups/:id                    - Delete group
POST   /v1/vehicle-groups/:groupId/vehicle       - Add vehicle to group
DELETE /v1/vehicle-groups/:groupId/vehicle/:vehicleId - Remove from group
```

#### Real-time Data
```
GET    /v1/realtime/tenants/:tenantId/vehicles   - Real-time vehicle status
```

#### Analytics & Reporting
```
GET    /v1/idling/index/{vehicle|vehicle-group}/:id      - Idling index data
GET    /v1/idling/points/{vehicle|vehicle-group}/:id     - Idling points (map coordinates)
GET    /v1/behavior/index/:vehicleId                      - Driving behavior index
GET    /v1/behavior/points/:vehicleId                     - Driving behavior points
GET    /v1/trip-history/index/:vehicleId                  - Trip history
GET    /v1/trips                                          - List trips
GET    /v1/fluctuation/:vehicleId                         - Performance fluctuation
GET    /v1/stop-and-go/index/:vehicleId                   - Stop & go analysis
GET    /v1/stop-and-go/points/:vehicleId                  - Stop & go points
```

#### Sites/Locations
```
GET    /v1/sites                                 - List sites
POST   /v1/sites                                 - Create site
GET    /v1/sites/:id                             - Get site details
PATCH  /v1/sites/:id                             - Update site
DELETE /v1/sites/:id                             - Delete site
```

#### Maintenance & Support
```
GET    /v1/raw-data/download                     - Export raw data
GET    /v1/jobs/:jobId                           - Get background job status
GET    /v1/device-health                         - Device health metrics
```

---

### Data Types & Models

#### User Model
```typescript
{
  id: string
  tenantId: string | null
  name: string
  email: string
  role: "superadmin" | "admin" | "mechanic" | "mastermechanic" | "driver"
  password: string (hashed)
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

#### Vehicle Model
```typescript
{
  id: string
  tenantId: string
  imei: string (unique IoT device identifier)
  licensePlate: string | null
  model: string (vehicle model name)
  type: VehicleType (HCV | MCV | SCV | Passenger)
  loadingPlatform: VehicleLoadingPlatform (Box | Tanker | Bulker | Trailer | Tipper | Hook Loader)
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

#### Trip Model
```typescript
{
  tripId: string
  vehicleId: string
  startTime: Date
  endTime: Date
  startLocation: {lng: number, lat: number}
  endLocation: {lng: number, lat: number}
  distance: number
  duration: number
  tenantId: string
  vehicle?: Vehicle
  tenant?: Tenant
}
```

#### Site Model
```typescript
{
  id: string
  tenantId: string
  name: string
  location: {lng: number, lat: number}
  radius: number
  createdAt: Date
  updatedAt: Date
}
```

---

### Infrastructure & Deployment

#### AWS Infrastructure (CDK)
```
Frontend Hosting:    AWS S3 + CloudFront CDN
  - S3 Bucket: Private (Block Public Access enabled)
  - CloudFront: Distribution with HTTPS enforcement
  - SSL/TLS: AWS ACM Certificate
  - Domain: Route53 DNS records
  - Error Handling: 403 errors redirect to index.html (SPA routing)

Deployment:          Automated via CDK (Infrastructure as Code)
Build Output:        /dist directory
Cache Invalidation:  CloudFront invalidates all paths on deployment
```

#### Environment Configuration
```
Development:  NODE_ENV=development (Vite dev server on configurable PORT)
Staging:      NODE_ENV=staging (S3+CloudFront deployment)
Production:   NODE_ENV=production (S3+CloudFront deployment)

Environment Variables:
- VITE_SERVER_URL:  Backend API base URL (must end with /)
- VITE_MAPBOX_TOKEN: Mapbox API token for map rendering
- PORT:             Development server port
```

#### Build & Deployment Pipeline
```
Build Command:  NODE_ENV=production vite build
Output:         Minified/optimized React SPA in /dist
Preview:        vite preview (local testing of production build)
Dev Server:     NODE_ENV=development bun vite (hot reload enabled)
```

---

### Static & Dynamic Pages

#### Static Content
- Login page (minimal static elements)
- UI components (Radix UI primitives, button, card, etc.)
- Navigation layouts (Sidebar, Topbar, Bottombar)

#### Dynamic Pages (18 pages)
1. **EntireStatusPage** - Real-time fleet map with live vehicle positions
2. **LiveTripMonitoringPage** - Active trips with real-time tracking
3. **PerformancePage** - Analytics with Recharts visualizations
4. **VehicleIdlingPage** - Idling statistics with time-series data
5. **DrivingBehaviourPage** - Driver behavior metrics
6. **TripHistoryPage** - Historical trip data with filtering
7. **TripEfficiencyPage** - Route efficiency analysis
8. **VehiclePage** - Vehicle CRUD operations
9. **SitePage** - Site/location management
10. **SiteEditPage** - Site editing form
11. **UserMangementPage** - User CRUD operations
12. **TenantManagementPage** - Multi-tenant administration
13. **DeviceHealthCheckPage** - Device diagnostics
14. **RawDataDownloadPage** - Data export functionality
15. **JobAnalysisPage** - Background job monitoring
16. **NotificationPage** - Home/notification dashboard
17. **NotFoundPage** - 404 error page
18. Plus driver/mechanic specific pages

---

### Third-party Integrations & External Services

1. **Mapbox GL JS**
   - Maps rendering and visualization
   - API Token: VITE_MAPBOX_TOKEN (client-side)
   - Risk: Token exposure in frontend code
   - Usage: Maps on EntireStatus, LiveTripMonitoring, SitePage

2. **Hono Framework**
   - Backend RPC framework (Hono 4.7.0)
   - Used for type-safe API client generation
   - API base URL configurable

3. **Vercel Deployment** (Optional)
   - Rewrites: All routes redirect to /index.html (SPA routing)
   - Used for staging environments

---

### Security Considerations & Implementation

#### Input Validation
```
Email: RFC 5322 validation via Zod
Password: Min 8 chars + 1 number (enforced client-side and server-side)
User Input: Form validation via React Hook Form + Zod schemas
API Parameters: Dynamic route parameters with regex patterns (e.g., type{^(vehicle|vehicle-group)$})
```

#### Output Encoding
- Tailwind CSS classes prevent CSS injection
- React JSX prevents XSS by default
- Form error messages are user-friendly but avoid technical details

#### Session Handling
```
Mechanism:     HTTP-only cookies (credentials: "include" in fetch requests)
Timeout:       Not specified - verify with backend team
Re-authentication: Auto-redirect to login
Session validation: /v1/me endpoint on app load
```

#### API Security
```
CORS:          Credentials included (cookies)
Method:        REST with RPC pattern
Query Caching: React Query with Infinity staleTime (verify expiration)
Error Handling: Generic error messages to frontend
```

---

### Known Dependencies with Potential Security Concerns

Review these for CVEs during VAPT:
1. **React 19.0.0** - Latest, actively maintained
2. **TypeScript 5.9.2** - Latest
3. **Vite 6.1.0** - Latest, check for build-time vulnerabilities
4. **Mapbox GL 3.14.0** - Verify map rendering security
5. **React Router 7.1.5** - Route-based vulnerabilities
6. **All Radix UI components** - Verify accessibility + security
7. **Zod 3.24.2** - Schema validation library
8. **Date-fns 4.1.0** - Date manipulation library

---

### Developer Experience & Code Quality

#### Type Safety
- Strict TypeScript mode enabled
- Path aliases: `~` for src, `~server` for backend
- Unused locals/parameters flagged

#### Code Quality Tools
- ESLint with React hooks rules
- Prettier formatting (auto-format on commit via lint-staged)
- React Query DevTools for API debugging
- Vite SWC compiler for fast transpilation

#### Development Environment
```
Dev Server:     Vite with hot reload
Preview Build:  vite preview
Port:           Configurable via PORT env var
Node Modules:   Bun or pnpm (lockfile: pnpm-lock.yaml or bun.lockb)
```

---

### Answers to the Questions for Your Backend Team Before VAPT

1. **Authentication Mechanism**
   - Backend uses **JWT-based authentication**.
   - Access token is accepted from either:
     - Signed HTTP-only `accessToken` cookie
     - `Authorization: Bearer <token>` header
   - Login issues `accessToken` and `refreshToken`, sets both as signed HTTP-only cookies, and also returns both tokens in the JSON response.
   - No OAuth or server-side session store is visible in the backend code.
   - Current token expiry:
     - Access token: 30 days
     - Refresh token: 5 minutes
   - Recommendation before VAPT: review access-token lifetime and whether tokens should be returned in JSON when cookie auth is used.

2. **HTTPS Enforcement**
   - API deployment is configured behind an AWS Application Load Balancer with ACM certificate.
   - HTTP redirect is enabled at the ALB level.
   - Caveat: ECS task public IP is enabled and API security group includes ingress for port `3001`; direct task exposure should be verified in AWS.
   - IoT listener traffic uses raw TCP ports, not HTTPS.

3. **CORS Policy**
   - CORS origins are configured from the `CORS_ORIGINS` environment variable.
   - `CORS_ORIGINS` is parsed as a comma-separated list of valid URLs.
   - Credentials are enabled with `credentials: true`.
   - No custom allowed methods or headers are explicitly configured in the backend code.

4. **Rate Limiting**
   - API rate limiting is implemented for unauthenticated requests.
   - Current limit: `60 requests / 60 seconds`.
   - Key is derived from the first `x-forwarded-for` IP value, falling back to `unknown`.
   - Authenticated requests are skipped by the current rate limiter.
   - No dedicated login-specific throttling or account lockout is visible.

5. **Database Security**
   - Backend connects to PostgreSQL through `DB_URL` and `RAW_DB_URL`.
   - PostgreSQL statement timeout is configured to 15 seconds.
   - RDS encryption-at-rest cannot be confirmed from the application code and should be verified in AWS.
   - Redis client uses TLS configuration, but certificate verification is disabled in code with `rejectUnauthorized: false`; this should be reviewed.
   - Sensitive configuration is supplied through environment variables, including DB URLs, JWT secret, master password, AWS keys, Redis URL, and raw DB URL.

6. **Audit Logging**
   - Backend includes request logging with request ID, user ID or forwarded IP, method, path, status, and elapsed time.
   - `x-request-id` is generated per request.
   - This is operational logging, not a full compliance-grade audit trail.
   - No dedicated before/after audit log for create/update/delete operations is visible.

7. **Password Hashing**
   - Passwords are hashed with **bcryptjs**.
   - Current bcrypt cost factor is `10`.
   - Login uses bcrypt comparison against the stored password hash.

8. **API Versioning**
   - API routes are mounted under `/v1`.
   - No formal API deprecation policy or multi-version lifecycle is visible in code.
   - Current backend route prefixing provides version separation, but version retirement should be documented if required for VAPT/compliance.

9. **Admin Privileges**
   - `superadmin` is the highest privilege role and bypasses tenant restrictions in multiple access helpers.
   - Some destructive support operations are superadmin-only, including analysis job data deletion.
   - Unauthenticated user creation is possible only if the caller knows `MASTER_PASSWORD`; this secret is therefore highly sensitive.
   - Backend roles include `superadmin`, `admin`, `manager`, `driver`, `mastermechanic`, and `mechanic`.
   - Recommendation before VAPT: verify frontend/backend role naming because the frontend document lists 5 roles while backend includes `manager`.

10. **Data Retention**
    - Raw data is archived nightly to S3 by the archiver service.
    - Raw DB table rotation flow:
      - `RawDataOld` -> `RawDataArchive`
      - `RawDataCurrent` -> `RawDataOld`
      - New `RawDataCurrent` is created from template
      - `RawDataArchive` is dropped after successful backup in staging/production
    - Raw archive S3 lifecycle:
      - Transition to Infrequent Access after 90 days
      - Transition to Glacier Instant Retrieval after 365 days
      - Transition to Deep Archive after 730 days
      - No final expiration is configured for raw archive objects.
    - Cron job request bucket lifecycle:
      - Jobs transition after 90 and 180 days
      - Jobs expire after 365 days
    - CloudWatch logs:
      - API logs: 1 week retention
      - Archiver logs: 1 week retention
      - Cron/orchestrator logs: 1 month retention

---

### Recommended VAPT Focus Areas

#### Frontend Specific
- [ ] XSS (Cross-Site Scripting) vulnerabilities
- [ ] CSRF (Cross-Site Request Forgery) protection
- [ ] Session hijacking / token theft
- [ ] Client-side input validation bypass
- [ ] Insecure direct object references (IDOR) via API manipulation
- [ ] Sensitive data exposure in localStorage/sessionStorage
- [ ] Mapbox token exposure/abuse

#### Backend Integration
- [ ] API authentication bypass
- [ ] Authorization flaws (role-based access control)
- [ ] SQL injection in dynamic queries
- [ ] API rate limiting/DDoS protection
- [ ] Insecure API endpoints
- [ ] Data exposure in API responses

#### Infrastructure
- [ ] S3 bucket misconfiguration
- [ ] CloudFront cache poisoning
- [ ] DNS attacks on Route53
- [ ] SSL/TLS certificate issues
- [ ] CloudFront distribution settings

#### Data Security
- [ ] Encryption in transit and at rest
- [ ] IoT device data integrity
- [ ] Real-time data stream security
- [ ] Data exposure in error messages
- [ ] Database access controls

---

## Summary

**Total Pages**: 18 authenticated + 1 login + 1 404 (20 total)

**Technology Stack**:
- React 19 + TypeScript 5.9 + Tailwind CSS 3.4
- Vite 6.1 build system
- React Query for data management
- Mapbox GL for geospatial visualization
- AWS S3 + CloudFront for hosting

**Key Security Features**:
- Role-based access control (5 roles)
- Protected routes with authentication middleware
- Input validation via Zod schemas
- TypeScript strict mode
- HTTP-only cookies for sessions

**Key Attack Surface**:
- 20+ API endpoints handling sensitive fleet data
- Real-time IoT data streaming
- Multi-tenant architecture
- Mapbox token exposure risk
- Client-side routing complexity
