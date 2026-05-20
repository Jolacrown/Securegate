---
name: securegate
description: Build, implement, and reason about SecureGate — a standalone authentication and IAM demonstration project. Use this skill whenever the user asks to create, edit, or debug any part of SecureGate including auth flows, JWT logic, middleware, RBAC, protected routes, password hashing, reset flows, or any frontend/backend component related to authentication and authorization. Also trigger when the user asks about security rules, folder structure, API contracts, database schema, or architecture decisions within this project. Do NOT use this skill for general auth questions unrelated to SecureGate, or for any feature outside the scope of authentication and authorization.
---

# SecureGate Skill

SecureGate is a **demonstration project** — not a full product.
It is a standalone authentication and Identity Access Management (IAM) layer built to showcase security-first engineering.

The agent's entire job is authentication and authorization. Nothing else belongs in this codebase.

---

## Project Snapshot

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Type           | Auth/IAM demonstration layer               |
| Frontend       | React or Next.js + Context API / Zustand   |
| Backend        | Node.js + Express.js or NestJS             |
| Database       | MongoDB or PostgreSQL                      |
| Auth Method    | JWT (JSON Web Tokens)                      |
| Password Hash  | bcrypt (min 10 rounds) or Argon2           |
| Token Storage  | `httpOnly` cookies (preferred)             |
| Roles          | Guest, User, Admin                         |

---

## Absolute Scope Rules

### Build ONLY:
- User registration, login, logout
- Password forgot/reset flow
- JWT issuance and validation
- Role-based access control (RBAC)
- Auth middleware (authenticateToken, authorizeRole)
- Protected route handling
- Minimal functional UI for the screens listed below

### Never Build:
- Business logic of any kind
- User profiles beyond auth data
- Analytics, dashboards with charts, or reporting
- Social features, feeds, or activity logs
- Email systems beyond password reset
- Payments, subscriptions, or billing
- Complex UI or design systems
- Any feature not directly tied to auth or authorization

If a request falls outside this scope — reject it and refocus.

---

## User Roles & Route Access

| Role  | Accessible Routes                                      |
|-------|--------------------------------------------------------|
| Guest | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| User  | `/dashboard`, `/profile`, `/settings`                  |
| Admin | All User routes + `/admin`                             |

- Unauthenticated → redirect to `/login`
- Wrong role → `403 Forbidden`

---

## Required Screens

| Screen          | Route              |
|-----------------|--------------------|
| Login           | `/login`           |
| Register        | `/register`        |
| Forgot Password | `/forgot-password` |
| Reset Password  | `/reset-password`  |
| User Dashboard  | `/dashboard`       |
| Admin Dashboard | `/admin`           |
| Access Denied   | `/403`             |

UI must be minimal and functional. Do not invest in visual complexity.

---

## API Endpoints

### Auth (Public)
```
POST /auth/register         — Validate input → hash password → create user
POST /auth/login            — Verify credentials → issue JWT
POST /auth/logout           — Clear token client-side
POST /auth/forgot-password  — Generate short-lived reset token
POST /auth/reset-password   — Validate token → update password → invalidate token
```

### Protected
```
GET /dashboard              — Role: User, Admin
GET /profile                — Role: User, Admin
GET /admin                  — Role: Admin only
```

---

## Middleware Chain (Must Run in This Order)

Every protected route must pass through both middleware before the handler runs:

```
Request
  ▼
[1] authenticateToken
    — Extract token from httpOnly cookie or Authorization header
    — Verify JWT signature using JWT_SECRET
    — Check expiration (exp claim)
    — Attach decoded payload to req.user
    — Return 401 if missing or invalid

  ▼
[2] authorizeRole(...allowedRoles)
    — Read role from req.user (set above)
    — Check against allowedRoles array
    — Return 403 if role is insufficient

  ▼
[3] Route Handler
    — Executes only if both middleware pass
```

---

## Database Schema

```
User {
  id:             UUID / ObjectId
  email:          String (unique, indexed, lowercase)
  password_hash:  String (bcrypt or Argon2)
  role:           Enum ["user", "admin"]
  created_at:     Timestamp
  updated_at:     Timestamp
}

ResetToken {
  id:             UUID / ObjectId
  user_id:        Reference → User
  token_hash:     String (hashed, never plaintext)
  expires_at:     Timestamp
  used:           Boolean
}
```

Only these two models exist. Do not expand the schema for non-auth purposes.

---

## Security Rules (Non-Negotiable)

### Passwords
- Never store plaintext — always hash with bcrypt (min 10 rounds) or Argon2
- Hash on the backend only, never on the client
- Minimum 8 chars, 1 uppercase, 1 number, 1 special character
- Never return `password_hash` in any API response

### JWT
- Always include `exp` claim
- Validate signature on every protected request
- Store in `httpOnly` cookie — never in localStorage if avoidable
- Clear on logout

### Reset Tokens
- Short-lived: 15–30 minutes max
- Single-use: invalidate immediately after use
- Store hashed in DB, never plaintext
- Always return generic success message — never reveal if email exists

### Input Validation
- Validate email format (normalize to lowercase)
- Validate password strength on register and reset
- Reject unexpected fields in all payloads (use Zod, Joi, or class-validator)

### General
- Return `"Invalid credentials"` for all auth failures — never specify which field failed
- Never expose stack traces to the client
- Store `JWT_SECRET`, `DB_URI`, `BCRYPT_ROUNDS` in `.env` only — never hardcode
- Frontend route guards are UX only — backend is always the source of truth

---

## Folder Structure

```
securegate/
├── client/
│   └── src/
│       ├── pages/          # Login, Register, Dashboard, Admin, ForgotPassword, AccessDenied
│       ├── context/        # Auth context or Zustand store
│       ├── guards/         # Route protection components
│       └── utils/          # API client, token helpers
│
├── server/
│   └── src/
│       ├── auth/           # auth.controller, auth.service, auth.routes
│       ├── middleware/     # authenticateToken.js, authorizeRole.js
│       ├── models/         # User.js, ResetToken.js
│       └── utils/          # jwt.js, hash.js
│
├── .env                    # Never commit — add to .gitignore
└── .gitignore
```

---

## User Flows (Reference)

### Registration
1. Validate email format and password strength
2. Check for duplicate email — reject with generic error if found
3. Hash password
4. Create user with role: `"user"` by default
5. Redirect to login or issue JWT immediately

### Login
1. Find user by email
2. Compare submitted password against stored hash
3. Sign JWT with `{ userId, role, exp }`
4. Set token in `httpOnly` cookie
5. Return success — protected routes now accessible

### Forgot Password
1. Accept email input
2. Always return generic success (never confirm if email exists)
3. If email found: generate short-lived token, hash it, store in DB
4. Send reset link (or log token in dev)

### Reset Password
1. Validate reset token exists, is unused, and is not expired
2. Validate new password strength
3. Hash new password and update user record
4. Mark reset token as used
5. Redirect to login

### Protected Route Access
1. Middleware extracts and verifies JWT
2. Middleware checks role from token payload
3. Access granted → handler executes
4. Access denied → 401 or 403

---

## Environment Variables Required

```
JWT_SECRET=
DB_URI=             # or DATABASE_URL
BCRYPT_ROUNDS=10
NODE_ENV=development
PORT=5000
```

---

## What This Skill Will Never Do

- Add features beyond the auth layer
- Suggest UI improvements beyond functional minimalism
- Implement post-MVP features (MFA, OAuth, refresh token rotation, audit logs, rate limiting, account lockout)
- Trust client-supplied role or identity data

---

## Core Principle

> SecureGate is an auth layer, not a product.
> Secure systems are intentionally engineered, not retrofitted later.
> Authentication proves identity. Authorization controls access. Nothing more.