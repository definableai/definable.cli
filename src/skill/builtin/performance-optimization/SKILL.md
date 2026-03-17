---
name: performance-optimization
description: Optimize application performance for speed, efficiency, and scalability. Use when profiling slow pages, reducing bundle size, optimizing database queries, improving Web Vitals, or conducting Lighthouse audits. Handles React rendering, code splitting, caching, N+1 queries, and image optimization.
allowed-tools: Read, Grep, Glob, Bash
metadata:
  tags: performance, optimization, lighthouse, web-vitals, caching, bundle-size
  platforms: Claude, ChatGPT, Gemini
---

# Performance Optimization

## When to use this skill

- Page load times are slow
- Lighthouse score needs improvement
- Bundle size is too large
- Database queries are slow
- React components re-render excessively
- Web Vitals (LCP, FID, CLS) need optimization

## Instructions

### Step 1: Measure First

**Profile, don't guess.** Always measure before optimizing.

```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse.json

# Bundle analysis
npx webpack-bundle-analyzer stats.json
# or for Next.js
ANALYZE=true npm run build
```

**Web Vitals targets** (WCAG):
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB (Time to First Byte) | < 800ms | 800ms - 1.8s | > 1.8s |

```typescript
// Track Web Vitals in production
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

### Step 2: React Optimization

**Prevent unnecessary re-renders**:
```typescript
// React.memo: skip re-render if props haven't changed
const ProductCard = React.memo(({ product }: { product: Product }) => {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  );
});

// useMemo: memoize expensive computations
function ProductList({ products, filter }: Props) {
  const filtered = useMemo(
    () => products.filter(p => p.category === filter).sort((a, b) => a.price - b.price),
    [products, filter]
  );

  return filtered.map(p => <ProductCard key={p.id} product={p} />);
}

// useCallback: memoize callbacks passed to child components
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return <ExpensiveChild onClick={handleClick} />;
}
```

**Virtualize long lists**:
```typescript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

### Step 3: Code Splitting and Lazy Loading

```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// Component-level lazy loading
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function AnalyticsPage() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

**Dynamic imports for heavy libraries**:
```typescript
// Instead of: import { format } from 'date-fns';
const formatDate = async (date: Date) => {
  const { format } = await import('date-fns');
  return format(date, 'yyyy-MM-dd');
};
```

### Step 4: Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image';

function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, 400px"
      loading="lazy"
    />
  );
}
```

**Image best practices**:
- Use WebP/AVIF format (30-50% smaller than JPEG)
- Serve responsive images with `srcset`
- Lazy load below-the-fold images
- Use blur placeholders for perceived performance
- Set explicit `width`/`height` to prevent CLS

### Step 5: Database Query Optimization

**Eliminate N+1 queries**:
```typescript
// BAD: N+1 problem
const users = await db.user.findMany();
for (const user of users) {
  const posts = await db.post.findMany({ where: { userId: user.id } });
  // This fires N additional queries
}

// GOOD: Single query with JOIN / include
const users = await db.user.findMany({
  include: { posts: true }
});
```

```sql
-- Add indexes on frequently queried columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Composite index for common query patterns
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 AND status = 'active';
```

**Caching with Redis**:
```typescript
import Redis from 'ioredis';
const redis = new Redis();

async function getUser(id: string) {
  // Check cache first
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // Query DB and cache result
  const user = await db.user.findUnique({ where: { id } });
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600); // 1 hour TTL

  return user;
}
```

### Step 6: Network Optimization

```typescript
// API response compression
import compression from 'compression';
app.use(compression());

// Cache headers
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true
}));

app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.json(data);
});
```

## Constraints

### Required rules (MUST)
1. **Measure before optimizing**: always profile first
2. **Target Lighthouse > 90** for performance score
3. **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Prohibited items (MUST NOT)
1. **Premature optimization**: don't optimize without evidence of a bottleneck
2. **Sacrificing readability**: don't make code unreadable for marginal gains
3. **Caching without invalidation**: always define TTL and invalidation strategy

## Best practices

1. **80/20 rule**: Focus on high-impact improvements first
2. **Continuous monitoring**: Track performance metrics in production
3. **Budget**: Set performance budgets (bundle size, load time) in CI
4. **Profile regularly**: Performance can regress silently

## References

- [web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
