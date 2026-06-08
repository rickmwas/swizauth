# SWIZAUTH

# OpenAPI Contract Specification

Version: 1.0

Base URL:

https://api.swizauth.com

API Version:

v1

Authentication:

Bearer JWT

Content-Type:

application/json

# Authentication Module

Base Route:

/api/v1/auth

## Register User

POST /auth/register

Request

{ "organization_id": "uuid", "email": "john@example.com", "password":
"SecurePassword123!", "first_name": "John", "last_name": "Doe" }

Response 201

{ "success": true, "message": "Registration successful", "user_id":
"uuid" }

Errors

400 Validation Error

409 Email Exists

429 Rate Limited

## Login

POST /auth/login

Request

{ "email": "john@example.com", "password": "SecurePassword123!" }

Response 200

{ "access_token": "...", "refresh_token": "...", "expires_in": 900,
"user": {} }

Errors

401 Invalid Credentials

423 Account Locked

429 Rate Limited

## Refresh Token

POST /auth/refresh

Request

{ "refresh_token": "..." }

Response

{ "access_token": "...", "refresh_token": "...", "expires_in": 900 }

## Logout

POST /auth/logout

Authorization Required

Response

{ "success": true }

## Logout All Devices

POST /auth/logout-all

Authorization Required

Response

{ "success": true }

## Verify Session

GET /auth/verify

Authorization Required

Response

{ "authenticated": true, "user": {}, "organization": {}, "roles": \[\],
"permissions": \[\] }

## Forgot Password

POST /auth/forgot-password

Request

{ "email": "john@example.com" }

Response

{ "success": true }

## Reset Password

POST /auth/reset-password

Request

{ "token": "...", "password": "NewPassword123!" }

Response

{ "success": true }

# User Module

Base Route

/api/v1/users

Authorization Required

## Get Current User

GET /users/me

Response

{ "id": "uuid", "email": "john@example.com", "roles": \[\],
"organization": {} }

## Update Profile

PATCH /users/me

Request

{ "first_name": "John", "last_name": "Doe", "avatar_url": "..." }

Response

{ "success": true }

## List Users

GET /users

Permission

users.read

Query Parameters

page

limit

search

Response

{ "items": \[\], "total": 100 }

## Get User

GET /users/{id}

Permission

users.read

## Create User

POST /users

Permission

users.create

## Update User

PATCH /users/{id}

Permission

users.update

## Delete User

DELETE /users/{id}

Permission

users.delete

# Organization Module

Base Route

/api/v1/organizations

## Create Organization

POST /organizations

Request

{ "name": "SwizFusion" }

Response

{ "id": "uuid" }

## Get Organization

GET /organizations/{id}

## Update Organization

PATCH /organizations/{id}

## Delete Organization

DELETE /organizations/{id}

# Membership Module

Base Route

/api/v1/memberships

## Invite Member

POST /memberships/invite

Request

{ "email": "user@example.com", "role_id": "uuid" }

Response

{ "success": true }

## Accept Invite

POST /memberships/accept

Request

{ "token": "..." }

Response

{ "success": true }

## Remove Member

DELETE /memberships/{id}

Permission

members.remove

# Role Module

Base Route

/api/v1/roles

## Create Role

POST /roles

Request

{ "name": "Manager", "description": "..." }

Response

{ "id": "uuid" }

## List Roles

GET /roles

## Update Role

PATCH /roles/{id}

## Delete Role

DELETE /roles/{id}

# Permission Module

Base Route

/api/v1/permissions

## List Permissions

GET /permissions

Response

{ "items": \[\] }

## Assign Permission To Role

POST /permissions/assign

Request

{ "role_id": "uuid", "permission_id": "uuid" }

# Session Module

Base Route

/api/v1/sessions

## Active Sessions

GET /sessions

Response

{ "items": \[\] }

## Revoke Session

DELETE /sessions/{id}

Response

{ "success": true }

# MFA Module

Base Route

/api/v1/mfa

## Enable MFA

POST /mfa/enable

Response

{ "secret": "...", "qr_code": "..." }

## Verify MFA

POST /mfa/verify

Request

{ "code": "123456" }

## Disable MFA

POST /mfa/disable

# OAuth Module

Base Route

/api/v1/oauth

## Authorization Endpoint

GET /oauth/authorize

Parameters

client_id

redirect_uri

scope

state

response_type

## Token Endpoint

POST /oauth/token

Supports

authorization_code

refresh_token

client_credentials

## Revoke Token

POST /oauth/revoke

## Introspect Token

POST /oauth/introspect

# Applications Module

Base Route

/api/v1/applications

## Create Application

POST /applications

Request

{ "name": "Inventory System", "redirect_urls": \[\] }

Response

{ "client_id": "...", "client_secret": "..." }

## List Applications

GET /applications

## Rotate Secret

POST /applications/{id}/rotate-secret

# API Keys Module

Base Route

/api/v1/api-keys

## Create API Key

POST /api-keys

Response

{ "key": "sk_live_xxxxx" }

## Revoke API Key

DELETE /api-keys/{id}

# Audit Module

Base Route

/api/v1/audit

## List Logs

GET /audit

Filters

action

user_id

date_from

date_to

## Export Logs

GET /audit/export

# Notification Module

Base Route

/api/v1/notifications

## Send Notification

POST /notifications

Request

{ "channel": "email", "template": "welcome" }

## Notification History

GET /notifications

# Webhooks Module

Base Route

/api/v1/webhooks

## Create Webhook

POST /webhooks

Request

{ "url": "...", "events": \[\] }

## List Webhooks

GET /webhooks

## Delete Webhook

DELETE /webhooks/{id}

# JWT Claims Structure

{ "sub": "user_id", "org": "organization_id", "email":
"user@example.com", "roles": \[\], "permissions": \[\], "session_id":
"uuid", "iat": 123456, "exp": 123456 }

# Error Format

{ "success": false, "error": { "code": "VALIDATION_ERROR", "message":
"Invalid request" } }

# Rate Limits

Login

10/minute

Register

5/minute

Password Reset

5/minute

API Keys

1000/minute

OAuth

100/minute

# SDK Contract

JavaScript

const auth = new SwizAuth()

await auth.login()

await auth.logout()

await auth.getUser()

await auth.hasPermission()

# Internal Service Endpoints

Used by NestJS Services

POST /internal/verify-token

GET /internal/users/{id}

GET /internal/organizations/{id}

GET /internal/permissions/{user_id}

POST /internal/audit-log

Protected by service-to-service authentication.

# Versioning Strategy

/api/v1

/api/v2

Breaking changes require major version upgrades.

Backward compatibility maintained for at least 12 months.
