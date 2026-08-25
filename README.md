# Canela Bank API

Comprehensive API documentation and developer guide for integrating with the Canela Bank digital banking platform.

## Problem Statement

Modern financial applications require robust, low-latency, and highly secure interfaces to facilitate real-time transactions, account management, and automated webhook notifications. Legacy banking architectures often lack clear documentation, reliable sandbox environments, and standardized security protocols.

## Solution

Canela Bank API provides a streamlined RESTful interface paired with real-time WebSocket event streams. Designed with developer experience as a core priority, the API features strict schema validation, deterministic error handling, end-to-end cryptographic verification, and sub-millisecond status processing.

## Tech Stack

- **Language & Runtime:** TypeScript / Node.js (v18+)
- **Protocol:** REST (JSON over HTTPS) & Webhooks (HMAC-SHA256 signed)
- **Authentication:** OAuth 2.0 / Bearer Tokens & API Key Pairs
- **Schema Validation:** OpenAPI 3.0 / Zod

---

## Quick Start

### 1. Installation & Environment

```bash
npm install @canela-bank/sdk dotenv
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```env
CANELA_API_KEY=cb_live_9f8a7b6c5d4e3f2a1
CANELA_API_SECRET=sec_abc1234567890xyz
CANELA_BASE_URL=https://api.canelabank.com/v1
```

### 3. Initialize the SDK

```typescript
import { CanelaClient } from '@canela-bank/sdk'

const client = new CanelaClient({
  apiKey: process.env.CANELA_API_KEY,
  apiSecret: process.env.CANELA_API_SECRET,
  environment: 'production',
})
```

---

## Testing Lifecycle

Follow this step-by-step verification pipeline to validate your integration before transitioning to production:

1. **Sandbox Provisioning:** Generate API keys in the developer dashboard under the Sandbox environment.
2. **Account Creation:** Post to `/v1/accounts` to establish test ledger accounts.
3. **Funding Simulation:** Use `/v1/sandbox/faucet` to deposit mock funds into your test account.
4. **Initiate Transfer:** Issue a POST request to `/v1/transfers` with idempotency keys.
5. **Webhook Verification:** Listen for the `transfer.completed` payload and verify the signature hash.

---

## Webhook Signature Verification

All webhook payloads sent by Canela Bank include a `X-Canela-Signature` header. You must verify this signature using your shared secret before processing the event.

```typescript
import * as crypto from 'crypto'

interface WebhookPayload {
  id: string
  event: string
  timestamp: number
  data: Record<string, any>
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const parts = signatureHeader.split(',')
  const timestampPart = parts.find((p) => p.startsWith('t='))
  const signaturePart = parts.find((p) => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) {
    return false
  }

  const timestamp = timestampPart.split('=')[1]
  const signature = signaturePart.split('=')[1]

  // Prevent replay attacks (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return false
  }

  const payloadToSign = `${timestamp}.${rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadToSign, 'utf8')
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  )
}
```

---

## Project Directory Tree

```
canela-bank-api/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── docs/
│   ├── api-reference.md
│   └── webhooks.md
├── src/
│   ├── client/
│   │   ├── http.ts
│   │   └── websocket.ts
│   ├── security/
│   │   └── signature.ts
│   ├── types/
│   │   ├── account.ts
│   │   ├── transfer.ts
│   │   └── webhook.ts
│   └── index.ts
├── tests/
│   ├── client.test.ts
│   └── signature.test.ts
├── .gitignore
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

---

## License

Copyright (c) 2024 Canela Bank Inc.
