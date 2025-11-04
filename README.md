# SocialNet Proxy

A lightweight reverse proxy server that serves as the central API gateway for the SocialNet application, routing requests between the frontend, backend API, and file server with built-in authentication and load balancing capabilities.

## 🚀 Tech Stack

- **Express.js 4.18** - Fast, unopinionated web framework for Node.js
- **TypeScript** - Type-safe development
- **JWT (jsonwebtoken)** - Token-based authentication
- **Winston 3.11** - Professional logging
- **CORS** - Cross-origin resource sharing support
- **data-structure-typed** - Advanced data structures for scheduling

## 🏗️ Architecture

### Reverse Proxy Pattern

The proxy acts as a single entry point for all client requests, routing them to appropriate backend services:

```
Client (Frontend)
       ↓
   Proxy Server (Port 3701)
       ↓
   ┌───┴───┬────────┐
   ↓       ↓        ↓
Auth    Backend   File
Routes   API     Server
```

### Key Features

- **Unified API Gateway**: Single entry point for all services
- **Request Routing**: Intelligent routing to backend services
- **Authentication Proxy**: Handles login/signup/logout flows
- **File Proxy**: Routes file operations to dedicated file server
- **Load Balancing**: Built-in scheduler with multiple strategies (planned)
- **Request Timing**: Logs response times for performance monitoring

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (version 16 or higher)
- npm or yarn
- Backend API server running (default: http://127.0.0.1:8000)
- File server running (default: http://localhost:9876)

## 🛠️ Installation

1. Navigate to the project directory:
```bash
cd SocialNet-Proxy-main
```

2. Install dependencies:
```bash
npm install
```

3. Configure the proxy settings:
Edit `src/config.ts` to match your environment:
```typescript
const TOKEN_CONFIG: TokenConfig = {
    auth: {
        location: "http://127.0.0.1:8000/auth/login",
        // ... other settings
    },
    signup: {
        location: "http://127.0.0.1:8000/auth/register"
    }
}

const FILE_CONFIG: FileConfig = {
    path: "http://localhost:9876"
}
```

## 🚦 Running the Server

### Development Mode
```bash
npm start
```

The proxy server will start at `http://192.168.196.10:3701`

### Production Mode
```bash
# Build TypeScript files
npx tsc

# Run compiled JavaScript
node src/rpcontroller.js
```

## 🌐 API Routes

### Authentication Routes (`/auth`)

All authentication requests are proxied to the backend API server.

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "identity": "user@example.com",
  "identityType": "email",
  "password": "password123"
}
```

**Response:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Invalid request format

#### Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- `201 Created` - Account created successfully
- `400 Bad Request` - Invalid request or email already exists

#### Logout
```http
POST /auth/logout
```

**Response:**
- `205 Reset Content` - Logout successful

#### Token Refresh
```http
POST /auth/refresh
Headers:
  X-Auth-Token: <auth-token>
  X-Refresh-Token: <refresh-token>
```

**Response:**
- `200 OK` - Returns new tokens in headers
- `401 Unauthorized` - Invalid tokens

### File Routes (`/file`)

File operations are proxied to the file server with stream handling.

#### Upload/Download/Delete File
```http
GET/POST/PUT/DELETE /file/:bucket/:key
```

**Parameters:**
- `bucket` - Storage bucket name
- `key` - File identifier

**Example - Upload:**
```bash
curl -X POST http://192.168.196.10:3701/file/my-bucket/user123/avatar.png \
  -H "Content-Type: image/png" \
  --data-binary @avatar.png
```

**Example - Download:**
```bash
curl http://192.168.196.10:3701/file/my-bucket/user123/avatar.png -o avatar.png
```

**Upload Limit:** 10MB

### API Routes (`/api`)

All API requests are proxied to the backend service.

```http
GET/POST/PUT/DELETE /api/*
```

**Example:**
```bash
# Get user profile
curl http://192.168.196.10:3701/api/users/profile

# Create a post
curl -X POST http://192.168.196.10:3701/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World", "content": "My first post"}'
```

All requests to `/api/*` are forwarded to `http://127.0.0.1:8000` with the same path and method.

## 📁 Project Structure

```
src/
├── rpcontroller.ts           # Main proxy server
├── config.ts                 # Configuration (endpoints, tokens)
├── routers/
│   ├── auth.router.ts        # Authentication routes
│   ├── file.router.ts        # File proxy routes
│   └── proxy.router.ts       # Backend API proxy routes
├── services/
│   ├── proxytunnel.service.ts    # Request relay functions
│   ├── token.service.ts          # JWT token management
│   ├── scheduler.service.ts      # Load balancing scheduler
│   ├── authgate.middleware.ts    # Authentication middleware
│   ├── logger.service.ts         # Winston logger
│   └── connection.util.ts        # Connection utilities
└── types/
    └── config.ts             # TypeScript type definitions
```

## 🔧 Configuration

### Server Configuration

**Host & Port:**
- Default: `192.168.196.10:3701`
- Configure in `src/rpcontroller.ts`

**CORS Settings:**
```typescript
{
  origin: '*',           // Allow all origins (configure for production)
  methods: 'GET,POST',   // Allowed HTTP methods
  credentials: true      // Allow cookies
}
```

### Backend Services

Configure backend service endpoints in `src/config.ts`:

**Authentication:**
- Login endpoint: `http://127.0.0.1:8000/auth/login`
- Signup endpoint: `http://127.0.0.1:8000/auth/register`

**API Server:**
- Base URL: `http://127.0.0.1:8000`
- Timeout: 1000ms

**File Server:**
- Base URL: `http://localhost:9876`

### JWT Token Configuration

```typescript
TOKEN_CONFIG = {
  auth: {
    SECRET: "auth_secret",
    expire_seconds: 1800  // 30 minutes
  },
  refresh: {
    SECRET: "refresh_secret",
    expire_seconds: 259200  // 3 days
  }
}
```

**⚠️ Security Warning:** Change default secrets in production!

## 🔀 Request Flow

### Authentication Flow
```
1. Client → POST /auth/login
2. Proxy → Forwards to Backend API
3. Backend → Validates credentials
4. Backend → Returns success/failure
5. Proxy → Returns response to client
```

### API Request Flow
```
1. Client → GET/POST /api/users/profile
2. Proxy → Extracts service name from path
3. Proxy → Routes to http://127.0.0.1:8000/users/profile
4. Backend → Processes request
5. Proxy → Returns JSON response to client
```

### File Request Flow
```
1. Client → POST /file/bucket/key
2. Proxy → Streams request to http://localhost:9876/bucket/key
3. File Server → Handles upload/download
4. Proxy → Streams response back to client
```

## 📊 Performance Features

### Request Timing
All requests are timed and logged:
```
Request to http://127.0.0.1:8000/api/users took 45ms
```

### Stream Handling
- File operations use streaming for memory efficiency
- No file size limitations from proxy (limited by file server)
- Binary data preserved through proxy

### Load Balancing (Planned)
The scheduler service includes support for:
- **SINGLETON**: Single server (current implementation)
- **ROUND_ROBIN**: Distribute requests evenly (planned)
- **WEIGHTED**: Weight-based distribution (planned)
- **LEAST_CONNECTIONS**: Route to least busy server (planned)

## 📝 Logging

### Winston Logger
Logs are written to:
- `combined.log` - All logs
- `error.log` - Error logs only

### Log Levels
- Info: Server events, request routing
- Warn: Authentication attempts
- Error: Failed requests, exceptions

### Example Logs
```
Server started
POST /auth/login - {identity: "user@example.com"}
Request to http://127.0.0.1:8000/auth/login took 120ms
```

## 🔐 Security Considerations

### Production Checklist
- [ ] Change JWT secrets from defaults
- [ ] Configure specific CORS origins (not `*`)
- [ ] Add rate limiting middleware
- [ ] Implement request validation
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Add authentication middleware to sensitive routes
- [ ] Implement request/response logging
- [ ] Set up monitoring and alerts

### Authentication Middleware
The `authgate.middleware.ts` can be enabled on routes:
```typescript
// Example: Protect file routes
fileRouter.use(authGate);
```

### CORS Configuration
For production, specify allowed origins:
```typescript
const corsOptions = {
  origin: ['https://socialnet.com', 'https://app.socialnet.com'],
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
};
```

## 🚀 Deployment

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx tsc

EXPOSE 3701

CMD ["node", "src/rpcontroller.js"]
```

Build and run:
```bash
docker build -t socialnet-proxy .
docker run -p 3701:3701 socialnet-proxy
```

### Docker Compose

```yaml
version: '3.8'
services:
  proxy:
    build: .
    ports:
      - "3701:3701"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
      - fileserver
  
  backend:
    image: socialnet-backend
    ports:
      - "8000:8000"
  
  fileserver:
    image: socialnet-fileserver
    ports:
      - "9876:9876"
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.socialnet.com;

    location / {
        proxy_pass http://localhost:3701;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
