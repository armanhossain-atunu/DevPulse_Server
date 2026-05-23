# DevPulse Server

A Node.js/Express API server for managing issues and user authentication built with TypeScript.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Access Control](#access-control)

## Features

- User authentication with JWT
- Issue management (CRUD operations)
- Role-based access control
- PostgreSQL database with Neon serverless
- TypeScript support
- Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: JWT
- **Database Client**: @neondatabase/serverless

## Installation

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Start development server
npm start
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@host/database
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## Running the Server

```bash
# Development mode
npm start

# Build and run
npm run build
npm start
```

The server will start on the configured PORT (default: 3000).

## API Endpoints

### Authentication

#### Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "contributor"
  }
  ```
- **Response**: User object with JWT token

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: JWT token

### Issues

#### Create Issue
- **Endpoint**: `POST /api/issues`
- **Access**: Authenticated users
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "title": "Database connection timeout",
    "description": "Pool exhausts after 50+ concurrent queries",
    "type": "bug"
  }
  ```
- **Response**: Created issue object

#### Get All Issues
- **Endpoint**: `GET /api/issues`
- **Access**: Public
- **Query Parameters**:
  - `type`: Filter by issue type (bug, feature, etc.)
  - `status`: Filter by status (open, in_progress, resolved)
  - `sort`: Sort order (oldest or newest)
- **Example**: `GET /api/issues?type=bug&status=open&sort=oldest`
- **Response**: Array of issues with reporter details

#### Get Single Issue
- **Endpoint**: `GET /api/issues/:id`
- **Access**: Public
- **Response**: Issue object with full reporter details

#### Update Issue
- **Endpoint**: `PATCH /api/issues/:id`
- **Access**: Authenticated users
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Request Body** (any of these fields):
  ```json
  {
    "title": "Updated title",
    "description": "Updated description",
    "type": "feature"
  }
  ```
- **Response**: Updated issue object
- **Note**: Status automatically changes to `in_progress` when an open issue is updated

#### Delete Issue
- **Endpoint**: `DELETE /api/issues/:id`
- **Access**: Maintainers only
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Response**: Success message

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: <JWT_TOKEN>
```

## Access Control

The API implements role-based access control:

| Action | Contributor | Maintainer |
|--------|------------|-----------|
| Create Issue | ✅ | ✅ |
| Get Issues | ✅ | ✅ |
| Update Own Issue (open) | ✅ | - |
| Update Any Issue | - | ✅ |
| Delete Issue | - | ✅ |

### Status Rules

- When a contributor or maintainer creates an issue, its status is `open`
- When an open issue is updated, the status automatically changes to `in_progress`
- Maintainers can update issues in any status
- Contributors can only update their own open issues

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(75) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
  passwordhash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Issues Table
```sql
CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": true
}
```

## Project Structure

```
src/
├── api/
│   ├── controller/
│   │   ├── auth.controller.ts
│   │   └── issues.controller.ts
│   ├── router/
│   │   ├── auth.router.ts
│   │   └── issues.router.ts
│   └── services/
│       ├── auth.services.ts
│       └── issues.services.ts
├── config/
│   └── index.ts
├── db/
│   └── index.ts
├── middleware/
│   ├── globalErrorHandler.ts
│   └── logger.ts
├── types/
│   ├── express.d.ts
│   └── index.ts
├── utility/
│   ├── auth.ts
│   ├── jwt.ts
│   └── sendResponse.ts
├── app.ts
└── index.ts
```

## License

MIT
