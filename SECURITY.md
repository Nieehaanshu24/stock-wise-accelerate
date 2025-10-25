# Security Policy

## Overview

This document outlines security considerations, best practices, and TODO items for the Dynamic Stock Analyzer application.

---

## Current Security Measures

### Backend

#### 1. HTTP Security Headers (Helmet)
- **Implemented**: `helmet` middleware protects against common vulnerabilities
- **Headers enabled**:
  - Content Security Policy
  - X-Frame-Options (DENY)
  - X-Content-Type-Options (nosniff)
  - Strict-Transport-Security (HSTS)
  - X-XSS-Protection

#### 2. Rate Limiting
- **Implemented**: Express rate limiting middleware
- **Default**: 100 requests per 15-minute window per IP
- **Configurable**: `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
- **Scope**: All API endpoints

#### 3. Input Validation
- **Implemented**: Express Validator middleware
- **Validated inputs**:
  - Stock symbols (alphanumeric, length limits)
  - Date ranges (valid dates, no future dates)
  - Numeric ranges (min/max bounds)
  - File uploads (type, size limits)
- **Sanitization**: Trim whitespace, type coercion

#### 4. CORS Configuration
- **Implemented**: Configurable CORS origins
- **Production**: Must set `CORS_ORIGIN` to specific domain(s)
- **Default Development**: `http://localhost:5173`
- **Recommendation**: Never use `*` in production

#### 5. Error Handling
- **Implemented**: Global error handler
- **Production mode**: Generic error messages, no stack traces
- **Development mode**: Detailed errors for debugging
- **Logging**: All errors logged with context

#### 6. File Operations
- **Portfolio storage**: JSON files with restricted access
- **Cache**: File-based cache in dedicated directory
- **Validation**: File paths sanitized to prevent traversal attacks
- **Permissions**: Run as non-root user in Docker

---

## Environment Variables & Secrets

### Current Implementation

#### Backend Environment Variables
```env
# Server
NODE_ENV=production
PORT=3001

# Security
CORS_ORIGIN=https://yourdomain.com

# External APIs
DATA_PROVIDER=yahoo|nse
NSE_API_KEY=<secret>
NSE_API_URL=<url>

# Storage
CACHE_DIR=./cache
PORTFOLIOS_DIR=./data/portfolios
```

#### Frontend Environment Variables
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Security Requirements

1. **Never commit credentials**
   - Use `.env` files (git-ignored)
   - `.env.example` contains variable names only
   - Documentation lists where to obtain credentials

2. **Production secrets management**
   - Use environment variable injection (Docker, Kubernetes secrets)
   - Consider secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Rotate credentials regularly

3. **Validation**
   - Backend validates all environment variables on startup
   - Missing required variables log warnings
   - Features gracefully disabled if credentials missing

---

## TODO: Security Enhancements

### High Priority

#### 1. API Authentication & Authorization
**Status**: Not implemented

**Recommendation**:
- Implement JWT-based authentication
- Add user roles (viewer, analyst, admin)
- Protect sensitive endpoints (portfolio delete, cache purge)
- Rate limit per user, not just IP

**Implementation approach**:
```typescript
// Add auth middleware
router.post('/portfolio/:id', authenticateJWT, authorize('analyst'), ...);
```

#### 2. Secrets Rotation
**Status**: Manual process

**TODO**:
- Document credential rotation procedure
- Implement graceful handling of credential updates
- Add support for multiple API keys (failover)
- Log rotation events

#### 3. Audit Logging
**Status**: Basic error logging only

**TODO**:
- Log all portfolio modifications (create, update, delete)
- Log authentication events
- Log data provider API usage
- Implement log retention policy
- Consider centralized logging (ELK stack, CloudWatch)

#### 4. HTTPS/TLS
**Status**: Application-level support ready, requires deployment configuration

**TODO**:
- Document TLS certificate setup
- Configure nginx/load balancer for HTTPS
- Enforce HTTPS redirects
- Implement HSTS with long max-age

### Medium Priority

#### 5. SQL Injection Protection
**Status**: Not applicable (JSON file storage)

**Future consideration**: If migrating to SQL database:
- Use parameterized queries
- Input sanitization
- ORM with built-in protections

#### 6. XSS Protection
**Status**: React provides basic protection

**Enhancements**:
- Sanitize user inputs before storage
- Implement Content Security Policy
- Audit any `dangerouslySetInnerHTML` usage (currently none)

#### 7. CSRF Protection
**Status**: Not implemented (stateless API)

**TODO if adding sessions**:
- Implement CSRF tokens
- SameSite cookie attributes

#### 8. File Upload Security
**Status**: Basic size limits implemented

**Enhancements**:
- Virus scanning for uploaded CSV files
- Stricter MIME type validation
- Sandboxed processing of user files
- Implement file content inspection

#### 9. Dependency Security
**Status**: Manual updates

**TODO**:
- Enable Dependabot alerts
- Regular `npm audit` runs in CI
- Automated dependency updates
- Pin dependency versions in production

#### 10. Native Module Security
**Status**: Custom C code, manual review

**TODO**:
- Static analysis of C code (Coverity, cppcheck)
- Memory leak detection (Valgrind)
- Buffer overflow testing
- Fuzzing test harness input

---

## Security Testing Checklist

### Before Deployment

- [ ] Run `npm audit` (backend and frontend)
- [ ] Update all dependencies to latest secure versions
- [ ] Review `.env.example` - ensure no secrets leaked
- [ ] Verify CORS configuration for production domain
- [ ] Test rate limiting effectiveness
- [ ] Validate input sanitization on all endpoints
- [ ] Review error messages - no sensitive data exposed
- [ ] Confirm HTTPS enforced
- [ ] Test authentication/authorization (when implemented)
- [ ] Verify file permissions (cache, logs, portfolios)

### Ongoing Monitoring

- [ ] Weekly dependency security scans
- [ ] Monthly credential rotation
- [ ] Quarterly security audit
- [ ] Review logs for suspicious patterns
- [ ] Monitor rate limit violations
- [ ] Track API usage anomalies

---

## Vulnerability Reporting

### Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security contact: [TO BE CONFIGURED]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix development**: Depends on severity
- **Disclosure**: Coordinated disclosure after fix deployed

---

## Compliance Considerations

### Data Privacy

**Current status**: No personal data collected

**If adding user accounts**:
- Implement GDPR compliance (EU users)
- Data retention policies
- User data export capability
- Right to deletion
- Privacy policy

### Financial Data Regulations

**Current status**: Display-only, no trading/advice

**Considerations**:
- Market data redistribution agreements
- Terms of service for data providers
- Disclaimers about investment decisions
- Regulatory requirements by jurisdiction

---

## Security Best Practices for Developers

1. **Never hardcode secrets** in source code
2. **Validate all inputs** before processing
3. **Sanitize outputs** before rendering
4. **Use parameterized queries** (if adding SQL)
5. **Implement least privilege** for file/API access
6. **Log security events** without exposing sensitive data
7. **Keep dependencies updated**
8. **Review code changes** for security implications
9. **Test error handling** - no information leakage
10. **Document security decisions** in code comments

---

## Incident Response Plan

### In Case of Security Breach

1. **Immediate Actions**:
   - Take affected system offline if necessary
   - Preserve logs for forensic analysis
   - Notify security contact

2. **Assessment**:
   - Determine scope of breach
   - Identify affected data/users
   - Document timeline of events

3. **Containment**:
   - Patch vulnerability
   - Rotate compromised credentials
   - Block malicious IPs/users

4. **Recovery**:
   - Deploy patched version
   - Verify system integrity
   - Restore from clean backups if needed

5. **Post-Incident**:
   - Conduct root cause analysis
   - Update security measures
   - Document lessons learned
   - Notify affected parties (if required)

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)

---

**Last Updated**: [DATE]

**Next Review**: [DATE + 6 months]
