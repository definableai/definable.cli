---
name: log-analysis
description: Analyze application logs to identify errors, performance issues, and security anomalies. Use when debugging production issues, investigating incidents, analyzing error patterns, monitoring performance, or detecting security threats. Handles Apache, Nginx, application, and JSON log formats.
allowed-tools: Read, Grep, Glob, Bash
metadata:
  tags: logs, debugging, error-analysis, performance, security, incident-response
  platforms: Claude, ChatGPT, Gemini
---

# Log Analysis

Analyze application logs to identify errors, performance bottlenecks, and security anomalies.

## When to use this skill

- Debugging production errors or exceptions
- Investigating incidents or outages
- Analyzing error frequency and patterns
- Monitoring response times and throughput
- Detecting security threats (brute force, injection attempts)
- Post-mortem analysis

## Instructions

### Step 1: Locate Log Files

```bash
# Common log locations
ls -la /var/log/                          # System logs
ls -la /var/log/nginx/                    # Nginx logs
ls -la /var/log/apache2/                  # Apache logs
find . -name "*.log" -type f             # Application logs in project

# Docker/container logs
docker logs <container> --tail 1000
docker logs <container> --since 1h

# Systemd journal
journalctl -u myapp --since "1 hour ago"
```

### Step 2: Search for Errors

```bash
# Find ERROR level logs
grep -i "ERROR\|FATAL\|CRITICAL" app.log

# Find exceptions with stack traces
grep -A 10 "Exception\|Traceback\|Error:" app.log

# Find HTTP 5xx errors
grep -E "HTTP/[0-9.]+ [5][0-9]{2}" access.log

# Find HTTP 4xx errors
grep -E "HTTP/[0-9.]+ [4][0-9]{2}" access.log

# Count errors by type
grep -oP "(?<=ERROR )\w+" app.log | sort | uniq -c | sort -rn

# Find errors in JSON logs
grep '"level":"error"' app.log | head -20
```

### Step 3: Analyze Patterns

**By time period**:
```bash
# Error frequency by hour
grep "ERROR" app.log | grep -oP "\d{4}-\d{2}-\d{2} \d{2}" | sort | uniq -c

# Errors in the last hour
grep "ERROR" app.log | awk -v date="$(date -d '1 hour ago' '+%Y-%m-%d %H')" '$0 >= date'

# Peak error times
grep "ERROR" app.log | cut -d' ' -f1-2 | cut -d: -f1-2 | sort | uniq -c | sort -rn | head -10
```

**By source/IP**:
```bash
# Top IP addresses by request count
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# Requests from a specific IP
grep "^192.168.1.100" access.log

# IPs with most 4xx/5xx errors
awk '$9 >= 400 {print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

**By endpoint**:
```bash
# Most requested endpoints
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -20

# Endpoints with most errors
awk '$9 >= 500 {print $7}' access.log | sort | uniq -c | sort -rn | head -10
```

### Step 4: Performance Analysis

```bash
# Response time analysis (Nginx with $request_time)
# Average response time
awk '{sum += $NF; count++} END {print sum/count}' access.log

# Slow requests (> 2 seconds)
awk '$NF > 2.0 {print $0}' access.log

# Response time percentiles
awk '{print $NF}' access.log | sort -n | awk '
  {a[NR]=$1}
  END {
    print "p50:", a[int(NR*0.5)];
    print "p90:", a[int(NR*0.9)];
    print "p95:", a[int(NR*0.95)];
    print "p99:", a[int(NR*0.99)];
  }'

# Requests per minute
awk '{print $4}' access.log | cut -d: -f1-3 | sort | uniq -c | sort -rn | head -10

# Slowest endpoints
awk '{print $7, $NF}' access.log | sort -k2 -rn | head -20
```

### Step 5: Security Analysis

```bash
# Detect SQL injection attempts
grep -iE "(union\s+select|or\s+1\s*=\s*1|drop\s+table|;\s*--)" access.log

# Detect XSS attempts
grep -iE "(<script|javascript:|onerror=|onload=)" access.log

# Detect directory traversal
grep -E "\.\./|\.\.%2f|%2e%2e" access.log

# Detect brute force (many failed logins from same IP)
grep "POST /api/auth/login" access.log | awk '$9 == 401 {print $1}' | sort | uniq -c | sort -rn | head -10

# Suspicious user agents
grep -iE "(sqlmap|nikto|dirbuster|gobuster|nmap|masscan)" access.log

# Unusually large request bodies
awk '$10 > 1000000 {print $1, $7, $10}' access.log
```

## Output format

### Analysis Report Structure

```markdown
## Log Analysis Report

### Summary
- **Time period**: 2024-01-15 00:00 - 23:59
- **Total requests**: 1,234,567
- **Error rate**: 2.3% (28,395 errors)
- **Avg response time**: 245ms

### Error Breakdown
| Error Type | Count | % of Total | Trend |
|-----------|-------|------------|-------|
| 500 Internal Server Error | 15,234 | 1.23% | UP |
| 502 Bad Gateway | 8,901 | 0.72% | STABLE |
| 404 Not Found | 4,260 | 0.35% | DOWN |

### Top Error Endpoints
| Endpoint | Error Count | Error Rate |
|----------|------------|------------|
| POST /api/payments | 5,234 | 8.2% |
| GET /api/users/:id | 3,102 | 3.1% |

### Performance Issues
| Endpoint | p50 | p90 | p99 |
|----------|-----|-----|-----|
| GET /api/search | 120ms | 890ms | 3.2s |
| POST /api/upload | 450ms | 2.1s | 8.5s |

### Security Alerts
- 3 IPs detected with SQL injection attempts
- 1 IP with 500+ failed login attempts (brute force)

### Recommendations
1. Investigate /api/payments 500 errors - increased 40% since yesterday
2. Add caching for /api/search - p99 exceeds 3s threshold
3. Block IP 203.0.113.42 - confirmed brute force attack
```

## Constraints

### Required rules (MUST)
1. **Read-only**: Never modify log files
2. **Mask sensitive data**: Redact passwords, tokens, PII in output
3. **Include timestamps**: Always reference time ranges in analysis
4. **Structured output**: Present findings as organized reports

### Prohibited items (MUST NOT)
1. Do not modify or delete any log files
2. Do not expose passwords, API keys, or tokens found in logs
3. Do not make assumptions without evidence from the logs

## Best practices

1. **Start broad, then narrow**: Overview first, then drill into specifics
2. **Correlate events**: Cross-reference access logs with application logs
3. **Track trends**: Compare against baseline, not just current state
4. **Automate recurring checks**: Set up alerts for critical patterns
5. **Preserve evidence**: For security incidents, preserve original logs

## References

- [Nginx Log Format](https://nginx.org/en/docs/http/ngx_http_log_module.html)
- [Apache Log Formats](https://httpd.apache.org/docs/current/logs.html)
- [ELK Stack](https://www.elastic.co/elastic-stack/)
- [GoAccess](https://goaccess.io/) - Real-time log analyzer
