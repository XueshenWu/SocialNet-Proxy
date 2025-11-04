# SocialNet File Server

A lightweight, high-performance file server with AWS S3 storage backend and Redis caching layer, designed to handle media uploads and downloads for the SocialNet application.

## 🚀 Tech Stack

- **Express.js 4.18** - Fast, unopinionated web framework for Node.js
- **TypeScript** - Type-safe development
- **AWS SDK v3** - Cloud storage integration with Amazon S3
- **Redis 4.6** - In-memory caching for fast file retrieval
- **Winston 3.11** - Professional logging
- **CORS** - Cross-origin resource sharing support

## 🏗️ Architecture

### Storage Strategy

**Two-Tier Storage System:**
1. **Remote Storage (AWS S3)** - Persistent cloud storage for all files
2. **Local Cache (Redis)** - Fast in-memory cache with automatic expiration

**Cache Flow:**
```
Upload:   Client → Server → S3 → Redis Cache
Download: Client → Server → Redis (if cached) → S3 (if cache miss) → Redis Cache
Delete:   Client → Server → S3 → Redis Invalidation
```

### Key Features

- **Automatic Caching**: Files are cached in Redis after upload or first retrieval
- **Smart Expiration**: Configurable TTL (Time To Live) for cached files
- **MIME Type Handling**: Efficient MIME type encoding/decoding
- **Graceful Shutdown**: Proper cleanup of connections on server close
- **File Size Limit**: 10MB upload limit (configurable)

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (version 16 or higher)
- npm or yarn
- AWS Account with S3 access
- Redis server (local or remote)
- AWS credentials configured

## 🛠️ Installation

1. Navigate to the project directory:
```bash
cd SocialNet-FileServer-main/fserver
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the `fserver` directory:
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_MAX_MEMORY=100mb
EXPIRE_TIME=60

# AWS Configuration (use environment variables or AWS credentials file)
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

4. Ensure AWS credentials are configured:
```bash
# Option 1: Environment variables (already in .env)
# Option 2: AWS credentials file (~/.aws/credentials)
# Option 3: IAM role (if running on EC2)
```

## 🚦 Running the Server

### Development Mode
```bash
npm start
```

The server will start at `http://localhost:9876`

### Production Mode
```bash
# Build TypeScript files
npx tsc

# Run compiled JavaScript
node src/server.js
```

## 🌐 API Endpoints

### Health Check
```http
POST /
```
Returns 200 OK to verify server is running.

### Upload File
```http
POST /:bucket/:key
Content-Type: <mime-type>
Body: <binary-data>
```

**Parameters:**
- `bucket` - S3 bucket name
- `key` - Unique file identifier

**Headers:**
- `Content-Type` - MIME type of the file

**Example:**
```bash
curl -X POST http://localhost:9876/my-bucket/user123/avatar.png \
  -H "Content-Type: image/png" \
  --data-binary @avatar.png
```

**Response:**
- `200 OK` - File uploaded successfully
- `500 Error` - Upload failed

### Download File
```http
GET /:bucket/:key
```

**Parameters:**
- `bucket` - S3 bucket name
- `key` - File identifier

**Example:**
```bash
curl http://localhost:9876/my-bucket/user123/avatar.png -o avatar.png
```

**Response:**
- `200 OK` - Returns file with appropriate Content-Type header
- `404 Not Found` - File doesn't exist

**Caching Behavior:**
- First request: Retrieves from S3, caches in Redis
- Subsequent requests: Serves from Redis cache (much faster)

### Delete File
```http
DELETE /:bucket/:key
```

**Parameters:**
- `bucket` - S3 bucket name
- `key` - File identifier

**Example:**
```bash
curl -X DELETE http://localhost:9876/my-bucket/user123/avatar.png
```

**Response:**
- `200 OK` - File deleted successfully
- `500 Error` - Deletion failed

## 📁 Project Structure

```
fserver/
├── src/
│   ├── server.ts           # Main Express server
│   ├── remote-storage.ts   # AWS S3 integration
│   ├── local-cache.ts      # Redis caching layer
│   ├── mimeutil.ts         # MIME type utilities
│   ├── logger.ts           # Winston logger configuration
│   ├── local-storage.ts    # Local storage (unused)
│   └── test.ts             # Testing utilities
├── logs/                   # Log files directory
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── test.py                 # Python test script
```

## 🔧 Configuration

### Server Configuration
- **Port**: 9876 (hardcoded in `server.ts`)
- **Upload Limit**: 10MB (configurable in Express middleware)
- **CORS**: Enabled for all origins

### Redis Configuration
Environment variables:
- `REDIS_URL` - Redis connection URL (default: `redis://localhost:6379`)
- `REDIS_DB` - Redis database number (default: 0)
- `REDIS_MAX_MEMORY` - Maximum memory for Redis (default: 100mb)
- `EXPIRE_TIME` - Cache expiration time in seconds (default: 60)

### AWS S3 Configuration
- **Region**: ca-central-1 (configurable in `remote-storage.ts`)
- **Authentication**: Uses AWS SDK default credential chain

### Supported MIME Types
- `application/json`
- `application/octet-stream`
- `application/xml`
- `text/plain`
- `text/html`
- `video/mp4`
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

## 📊 Performance Optimization

### Caching Strategy
- **Cache Hit**: ~1-5ms response time
- **Cache Miss**: ~100-300ms response time (depends on S3 latency)
- **Automatic Expiration**: Configurable TTL prevents cache bloat

### Memory Management
- Redis `maxmemory` policy ensures controlled memory usage
- LRU eviction policy for cache entries
- Configurable cache size via `REDIS_MAX_MEMORY`

## 📝 Logging

### Log Levels
The server uses Winston for structured logging:
- **info**: Server events, cache hits/misses
- **error**: Error conditions

### Log Files
Logs are written to the `logs/` directory with automatic rotation.

### Example Log Output
```
info: Server started at http://localhost:9876
info: RemoteStorage initialized
info: LocalCache initialized
info: GET my-bucket/user123/avatar.png
info: Cache hit for user123/avatar.png
```

## 🧪 Testing

A Python test script is included for basic functionality testing:

```bash
python test.py
```

For manual testing, use the provided `test.ts` file or HTTP clients like curl, Postman, or HTTPie.

