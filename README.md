# Polkablocks 🔥🟣

**Payment Gateway for Polkadot - Bridging the gap between Polkadot and Fireblocks**

## 🚨 Problem
CEXs and merchants can't accept Polkadot payments easily - Fireblocks doesn't support Polkadot wallets, and existing solutions lack proper notifications and payment tracking.

## 💡 Solution
Polkablocks is a payment gateway MVP that handles DOT transactions with enterprise-grade email notifications, webhook callbacks, and transaction monitoring.

## 🛠 Tech Stack
- **NestJS** - Backend API framework
- **SubQL** - Polkadot blockchain indexer
- **PostgreSQL** - Database for transaction & merchant data
- **Nodemailer** - Email notifications
- **Polkadot.js** - Blockchain interaction

## ✅ Core Features (MVP)
- **Email Notifications** - Instant email alerts for all transactions
- **Payment Processing** - Generate payment addresses & track payments
- **Webhook Callbacks** - Notify merchants of payment status
- **API Key Authentication** - Secure merchant access
- **Transaction Monitoring** - Real-time status tracking

## 📋 TODO List (3-Hour Sprint)

### Hour 1: Email & Payment Foundation
- [ ] Initialize NestJS project with TypeScript
- [ ] **Set up email service (PRIORITY #1)**:
  - [ ] Configure Nodemailer with SMTP
  - [ ] Create email templates (payment received, payment sent, payment failed)
  - [ ] Test email sending endpoint
- [ ] Set up PostgreSQL with schema:
  - `merchants` table (id, name, email, api_key, webhook_url)
  - `payment_requests` table (id, merchant_id, amount, address, status, callback_url)
  - `transactions` table (hash, payment_request_id, from, to, amount, status, email_sent)
- [ ] Configure SubQL indexer for payment monitoring
- [ ] Create merchant registration endpoint with API key generation

### Hour 2: Payment Gateway Core
- [ ] Implement payment request service:
  - [ ] POST `/api/payments/create` - Generate payment address & amount
  - [ ] GET `/api/payments/:id/status` - Check payment status
  - [ ] Generate unique payment addresses per request
- [ ] SubQL event handlers:
  - [ ] Monitor incoming payments to generated addresses
  - [ ] **Trigger email notifications on payment received**
  - [ ] Update payment request status in DB
- [ ] Implement webhook service:
  - [ ] Queue webhook calls on payment confirmation
  - [ ] Retry logic for failed webhooks
  - [ ] Log webhook responses

### Hour 3: Complete Payment Flow & Polish
- [ ] **Email notification triggers**:
  - [ ] Payment received (to merchant)
  - [ ] Payment confirmed (to customer email if provided)
  - [ ] Payment failed/expired notifications
- [ ] Transaction execution for payouts:
  - [ ] POST `/api/payouts` - Send DOT to addresses
  - [ ] **Email confirmation on successful payout**
- [ ] Implement payment expiry (15-minute timeout)
- [ ] Add idempotency keys to prevent duplicate payments
- [ ] Basic webhook signature verification
- [ ] Create simple checkout page (HTML + JS):
  - [ ] Display payment address & QR code
  - [ ] Show payment status in real-time
  - [ ] Email receipt option

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run PostgreSQL
docker-compose up -d postgres

# Run migrations
npm run migration:run

# Start SubQL indexer
cd subql && yarn start

# Start NestJS server
npm run start:dev
```

## 📡 API Endpoints (Payment Gateway)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants/register` | Register merchant account |
| POST | `/api/payments/create` | Create payment request |
| GET | `/api/payments/:id/status` | Check payment status |
| POST | `/api/payouts` | Execute payout (send DOT) |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/webhooks/test` | Test webhook delivery |

## 💳 Payment Flow
1. Merchant creates payment request with amount
2. System generates unique payment address
3. Customer sends DOT to address
4. SubQL detects payment
5. **Email sent to merchant & customer**
6. Webhook triggered to merchant URL
7. Payment marked as complete

## 🔧 What's Missing for Production
After hackathon, you'll need:
- [ ] KYC/AML integration
- [ ] Multi-currency support
- [ ] Admin dashboard
- [ ] Rate limiting & DDoS protection
- [ ] Comprehensive webhook retry strategy
- [ ] Payment reconciliation system
- [ ] Refund mechanism
- [ ] SSL/TLS for webhooks
- [ ] Audit logging
- [ ] PCI compliance considerations

## 📝 Environment Variables
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/polkablocks

# Blockchain
POLKADOT_RPC_URL=wss://rpc.polkadot.io
SUBQL_ENDPOINT=http://localhost:3000

# Email (PRIORITY!)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=payments@polkablocks.io

# Security
JWT_SECRET=your-secret-key
WEBHOOK_SIGNING_SECRET=webhook-secret

# Payment Config
PAYMENT_EXPIRY_MINUTES=15
CONFIRMATION_BLOCKS=2
```

## 📧 Email Templates Needed
```
1. payment_received.html - "Payment of X DOT received"
2. payment_confirmed.html - "Payment confirmed after X blocks"
3. payment_expired.html - "Payment request expired"
4. payout_sent.html - "Payout of X DOT sent to address"
```

## 🏁 Success Criteria
- ✅ **Email notifications work for all transactions**
- ✅ Can create payment requests with unique addresses
- ✅ Payments are detected and processed automatically
- ✅ Webhooks fire on payment completion
- ✅ Basic checkout page works
- ✅ Can execute payouts with email confirmation

---
**Hackathon Focus:** Payment Gateway MVP with Email Notifications  
**Duration:** 3 Hours  
**Status:** 🔴 In Progress