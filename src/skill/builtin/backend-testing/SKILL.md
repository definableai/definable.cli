---
name: backend-testing
description: Write and run backend tests including unit tests, integration tests, and API tests. Use when asked to test APIs, write backend tests, validate endpoints, test database operations, or verify authentication flows. Handles Jest, Pytest, Mocha, Supertest, and other testing frameworks.
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata:
  tags: testing, backend, unit-test, integration-test, API-test, Jest, Pytest
  platforms: Claude, ChatGPT, Gemini
---

# Backend Testing

Write and run backend tests for APIs, database operations, authentication, and business logic.

## When to use this skill

- Writing unit tests for backend functions
- Testing REST API endpoints
- Validating database operations
- Testing authentication and authorization flows
- Setting up test infrastructure

## Instructions

### Step 1: Environment Setup

**Node.js (Jest + Supertest)**:
```bash
npm install --save-dev jest supertest @types/jest ts-jest
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.(ts|js)'],
  setupFilesAfterSetup: ['./jest.setup.js'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  }
};
```

**Python (Pytest)**:
```bash
pip install pytest pytest-asyncio httpx
```

```python
# conftest.py
import pytest
from app import create_app
from database import TestDatabase

@pytest.fixture
def app():
    app = create_app(testing=True)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def clean_db():
    TestDatabase.reset()
    yield
    TestDatabase.cleanup()
```

### Step 2: Unit Testing

Test isolated functions with mocked dependencies:

```typescript
// __tests__/services/user.test.ts
import { UserService } from '../../services/user';

describe('UserService', () => {
  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      expect(UserService.validatePassword('short')).toBe(false);
    });

    it('should accept valid passwords', () => {
      expect(UserService.validatePassword('ValidPass123!')).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      expect(UserService.validatePassword('nouppercase123!')).toBe(false);
    });
  });
});
```

```python
# tests/test_user_service.py
def test_validate_password_rejects_short():
    assert UserService.validate_password("short") is False

def test_validate_password_accepts_valid():
    assert UserService.validate_password("ValidPass123!") is True
```

### Step 3: Integration Testing (API Endpoints)

```typescript
// __tests__/routes/users.test.ts
import request from 'supertest';
import app from '../../app';

describe('POST /api/users', () => {
  beforeEach(async () => {
    await db.user.deleteMany();
  });

  it('should create user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'test@example.com',
      username: 'testuser'
    });

    // Verify persisted to DB
    const user = await db.user.findUnique({
      where: { email: 'test@example.com' }
    });
    expect(user).toBeTruthy();
  });

  it('should reject duplicate email', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', username: 'user1', password: 'Pass123!' });

    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', username: 'user2', password: 'Pass123!' });

    expect(response.status).toBe(409);
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'not-an-email', username: 'user', password: 'Pass123!' });

    expect(response.status).toBe(400);
  });
});
```

```python
# tests/test_users_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/users", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "Password123!"
    })
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_duplicate_email(client: AsyncClient):
    await client.post("/api/users", json={
        "email": "test@example.com", "username": "user1", "password": "Pass123!"
    })
    response = await client.post("/api/users", json={
        "email": "test@example.com", "username": "user2", "password": "Pass123!"
    })
    assert response.status_code == 409
```

### Step 4: Authentication Testing

```typescript
describe('Authentication', () => {
  let token: string;

  it('should login with valid credentials', async () => {
    // Create user first
    await request(app).post('/api/users').send({
      email: 'auth@test.com', username: 'authuser', password: 'Pass123!'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auth@test.com', password: 'Pass123!' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    token = response.body.token;
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auth@test.com', password: 'wrong' });

    expect(response.status).toBe(401);
  });

  it('should access protected route with valid token', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should reject access without token', async () => {
    const response = await request(app).get('/api/profile');
    expect(response.status).toBe(401);
  });

  it('should enforce role-based access', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
```

### Step 5: Test Isolation (Mocking External Dependencies)

```typescript
// Mock external API
jest.mock('../../services/paymentGateway');
import { processPayment } from '../../services/paymentGateway';

describe('OrderService', () => {
  it('should process order with successful payment', async () => {
    (processPayment as jest.Mock).mockResolvedValueOnce({
      success: true, transactionId: 'txn_123'
    });

    const order = await OrderService.create({
      userId: 'user1', items: [{ id: 'item1', qty: 2 }]
    });

    expect(order.status).toBe('confirmed');
    expect(processPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: expect.any(Number) })
    );
  });

  it('should handle payment failure gracefully', async () => {
    (processPayment as jest.Mock).mockRejectedValueOnce(
      new Error('Payment declined')
    );

    const order = await OrderService.create({
      userId: 'user1', items: [{ id: 'item1', qty: 2 }]
    });

    expect(order.status).toBe('payment_failed');
  });
});
```

## Output format

```
__tests__/
  services/
    user.test.ts
    order.test.ts
  routes/
    users.test.ts
    auth.test.ts
```

```bash
# Run tests
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage report
npm test -- --testPathPattern=users  # Run specific tests
```

## Constraints

### Required rules (MUST)
1. Tests must use a separate or in-memory DB, never production
2. Each test must be independent with no shared mutable state
3. Use AAA pattern: Arrange-Act-Assert
4. Test names must clearly describe what is being verified

### Prohibited items (MUST NOT)
1. Do not use production databases
2. Do not make real external API calls — mock them
3. Do not hardcode secrets in test files

## Best practices

1. **Test-Driven Development**: Write tests before implementation
2. **Given-When-Then**: Structure test descriptions clearly
3. **Test edge cases**: Empty inputs, null values, boundary conditions
4. **Happy + Sad paths**: Test both success and failure scenarios
5. **Clean up**: Always reset DB state between tests
