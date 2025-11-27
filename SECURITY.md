# Security Policy

## Overview

Audtheia handles sensitive environmental data and integrates with multiple third-party services. This document outlines security best practices, credential management, and vulnerability reporting procedures.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### 1. API Key Management

**CRITICAL: Never commit API keys to Git**

All API credentials must be stored in environment variables, never hardcoded in files.

**✅ CORRECT**:
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('ANTHROPIC_API_KEY')
```

**❌ INCORRECT**:
```python
api_key = "sk-ant-api03-..."  # NEVER DO THIS
```

### 2. Environment File Security

**`.env` File Protection**:

The `.env` file contains ALL sensitive credentials and must NEVER be committed to Git.

**Verify `.gitignore` includes**:
```
# Environment variables
.env
.env.local
.env.*.local

# API keys
**/config/credentials.json
**/config/secrets.yaml

# N8N credentials
~/.n8n/

# Roboflow cache
.roboflow/
```

**Check with**:
```bash
# Verify .env is ignored
git check-ignore .env
# Should output: .env

# Verify no sensitive data in Git
git log --all --full-history --source -- .env
# Should be empty
```

### 3. N8N Credential Vault

**Use N8N's built-in credential management**:

1. **Never use environment variables in N8N workflows for production**
2. **Always use N8N Credentials**:
   - Navigate to: Settings → Credentials
   - Add credentials for each service
   - Reference in nodes via dropdown (not hardcoded)

**Example - Anthropic Credential in N8N**:
```
Name: Anthropic Claude API
Type: HTTP Request Auth
Method: Header Auth
Header Name: x-api-key
Header Value: [Your API key]
```

**Example - Airtable Credential**:
```
Name: Airtable Audtheia
Type: Airtable Personal Access Token
Token: patXXXXXXXXXXXXXX
```

### 4. Credential Rotation

**Rotate API keys every 90 days**:

| Service | Rotation Schedule | Priority |
|---------|------------------|----------|
| Anthropic | 90 days | High |
| OpenAI | 90 days | High |
| Airtable | 90 days | High |
| Roboflow | 180 days | Medium |
| Mapbox | 180 days | Medium |
| GBIF | Annual | Low (public data) |

**Rotation Checklist**:
1. Generate new API key in service dashboard
2. Update `.env` file locally
3. Update N8N credentials
4. Test all workflows
5. Revoke old API key
6. Document rotation date

### 5. Webhook Security

**N8N Webhook Protection**:

Webhooks are public URLs by default. Protect them:

**Option 1: Authentication Header**:
```python
# In Roboflow Analyst_Caller block
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('N8N_WEBHOOK_TOKEN')}"
}
response = requests.post(webhook_url, json=payload, headers=headers)
```

**Option 2: IP Whitelist** (N8N Cloud):
- Settings → Security → IP Whitelist
- Add your server/office IP addresses

**Option 3: API Key Parameter**:
```
https://your-n8n.app.n8n.cloud/webhook/rtsp-analyst?api_key=YOUR_SECRET_KEY
```

Verify in N8N:
```javascript
// In Webhook node
if ($json.query.api_key !== 'YOUR_SECRET_KEY') {
  $response.status(401).json({ error: 'Unauthorized' });
}
```

### 6. Airtable Security

**Personal Access Token Scopes**:

Only grant minimum required permissions:

**Required Scopes**:
- `data.records:read` - Read observation data
- `data.records:write` - Write new observations

**NOT Required** (don't grant):
- `schema:read` - Base structure
- `schema:write` - Modify tables
- `webhook:manage` - Create webhooks
- `user.email:read` - User data

**Base Access**:
- Limit to "Audtheia Environmental Monitoring" base only
- Do NOT grant "All current and future bases"

**Token Storage**:
```bash
# In .env file
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX  # Personal Access Token, NOT API Key
```

### 7. Data Privacy

**Coordinate Precision**:

For public datasets, truncate coordinates to protect sensitive locations:

```python
# Truncate to 3 decimal places (~110m precision)
def truncate_coordinates(lat, lon):
    return round(lat, 3), round(lon, 3)

# Example:
# Exact: 10.234567, -84.567890
# Public: 10.235, -84.568
```

**Image URL Expiration**:

Satellite imagery URLs should expire:

```python
# Mapbox URLs with expiration
url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/..."
# Add parameter: &fresh=true  (forces new token)
```

**PII Avoidance**:

Never store in Airtable:
- Personal names of researchers
- Contact information
- Equipment serial numbers
- GPS tracks from personal devices

### 8. Network Security

**HTTPS Only**:

All API calls must use HTTPS:

```python
# ✅ Correct
url = "https://api.gbif.org/v1/species/match"

# ❌ Incorrect
url = "http://api.gbif.org/v1/species/match"  # Insecure
```

**RTSP Stream Security**:

For RTSP cameras:
```bash
# Use authentication in URL
RTSP_CAMERA_URL=rtsp://username:password@camera-ip:554/stream

# Or use RTSPS (RTSP over TLS)
RTSP_CAMERA_URL=rtsps://username:password@camera-ip:554/stream
```

**VPN for Remote Access**:

If accessing N8N or cameras remotely, use VPN:
- WireGuard (recommended)
- OpenVPN
- Tailscale

### 9. Dependency Security

**Keep packages updated**:

```bash
# Check for vulnerabilities
pip install safety
safety check

# Update packages
pip install --upgrade -r requirements.txt
```

**Pin versions in production**:

```
# requirements.txt
anthropic==0.18.1  # Specific version
roboflow==1.1.5    # Not >=1.1.0
```

**Monitor for CVEs**:
- GitHub Dependabot (enable in repository settings)
- Snyk (free for open-source)

### 10. Logging Security

**Never log sensitive data**:

```python
# ✅ Safe logging
logger.info(f"API call to Anthropic successful")

# ❌ Dangerous logging
logger.info(f"API key: {api_key}")  # NEVER LOG KEYS
logger.debug(f"Response: {response.json()}")  # May contain sensitive data
```

**Log rotation**:

Prevent disk space issues and data leakage:

```python
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'audtheia.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

---

## Vulnerability Reporting

### Reporting a Security Issue

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, report privately:

**Email**: security@audtheia.org (if available)  
**GitHub**: Use GitHub Security Advisories (recommended)

1. Navigate to: https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring/security/advisories
2. Click "Report a vulnerability"
3. Provide details:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

**What to include**:
- Vulnerability type (e.g., exposed API key, SQL injection)
- Affected components (Roboflow, N8N, Airtable)
- Severity (Critical, High, Medium, Low)
- Proof of concept (if applicable)

### Response Timeline

| Severity | Response Time | Fix Timeline |
|----------|--------------|--------------|
| Critical | 24 hours | 72 hours |
| High | 48 hours | 7 days |
| Medium | 7 days | 30 days |
| Low | 14 days | 90 days |

### Security Updates

Security patches will be released as:
- **Critical**: Immediate patch release (1.0.x)
- **High**: Next scheduled release
- **Medium/Low**: Quarterly updates

---

## Security Checklist for Deployment

Before deploying Audtheia to production:

**Credentials**:
- [ ] All API keys stored in `.env` or N8N vault
- [ ] No credentials in Git history
- [ ] `.gitignore` properly configured
- [ ] N8N credentials use vault (not environment variables)

**Network**:
- [ ] All API calls use HTTPS
- [ ] RTSP streams use authentication
- [ ] N8N webhooks protected (auth header, IP whitelist, or API key)
- [ ] VPN configured for remote access

**Airtable**:
- [ ] Personal Access Token with minimum scopes
- [ ] Token limited to single base
- [ ] Coordinates truncated for public sharing
- [ ] No PII stored in database

**Monitoring**:
- [ ] Logging configured (no sensitive data logged)
- [ ] Log rotation enabled
- [ ] Dependency scanning enabled (Dependabot)
- [ ] API key expiration dates documented

**Code**:
- [ ] No hardcoded credentials
- [ ] Input validation on all external data
- [ ] Error messages don't reveal sensitive info
- [ ] Dependencies pinned to specific versions

---

## Common Security Mistakes

### Mistake 1: Committing `.env` to Git

**Problem**: API keys exposed in public repository

**Detection**:
```bash
git log --all --full-history --source -- .env
```

**Fix**:
```bash
# Remove from history (use BFG Repo Cleaner)
bfg --delete-files .env

# Or filter-branch (more complex)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

**Prevention**:
- Add `.env` to `.gitignore` BEFORE first commit
- Use `.env.template` with placeholder values

### Mistake 2: Hardcoded Credentials in Code

**Problem**: API keys visible in source code

**Detection**:
```bash
# Search for potential API keys
grep -r "sk-ant" .
grep -r "api_key.*=" . | grep -v "os.getenv"
```

**Fix**:
- Move to `.env` file
- Use environment variables
- Rotate compromised keys immediately

### Mistake 3: Exposing Webhook URLs

**Problem**: Public webhook URLs can be abused

**Fix**:
- Add authentication header
- Use API key parameter
- Implement rate limiting in N8N

### Mistake 4: Overprivileged API Tokens

**Problem**: Token has more permissions than needed

**Fix**:
- Review Airtable token scopes
- Limit to single base
- Use read-only tokens where possible

### Mistake 5: Logging Sensitive Data

**Problem**: API keys or PII in log files

**Detection**:
```bash
grep -i "api_key" audtheia.log
grep -i "password" audtheia.log
```

**Fix**:
- Remove sensitive logging statements
- Use log filtering/masking
- Implement proper log rotation

---

## Incident Response Plan

If credentials are compromised:

**Immediate Actions** (within 1 hour):
1. **Revoke compromised credentials** in service dashboards
2. **Generate new credentials**
3. **Update `.env` and N8N vault**
4. **Test all workflows**

**Short-term Actions** (within 24 hours):
5. **Review access logs** for unauthorized usage
6. **Notify affected parties** (if data breach)
7. **Document incident**

**Long-term Actions** (within 1 week):
8. **Implement additional safeguards** (2FA, IP whitelist)
9. **Security audit** of all credentials
10. **Update security documentation**

---

## Third-Party Service Security

### Anthropic Claude
- **API Key**: High-value target
- **Protection**: Rotate every 90 days, use environment variables
- **Monitoring**: Check usage dashboard for anomalies

### OpenAI GPT-4
- **API Key**: High-value target
- **Protection**: Set usage limits ($50/month recommended)
- **Monitoring**: Enable usage alerts

### Airtable
- **Personal Access Token**: Critical (full database access)
- **Protection**: Minimum scopes, single base only
- **Monitoring**: Review access logs monthly

### Roboflow
- **API Key**: Medium risk
- **Protection**: Workspace-level key (not account-level)
- **Monitoring**: Check API usage statistics

### Mapbox
- **Access Token**: Low risk (limited to satellite imagery)
- **Protection**: URL restrictions (allow only your domain)
- **Monitoring**: Set rate limits

---

## Compliance Considerations

### FAIR Data Principles
- **Findable**: Metadata includes DOI or unique identifier
- **Accessible**: Data stored in accessible format (JSON, CSV)
- **Interoperable**: Standard schemas (Darwin Core compatible)
- **Reusable**: Clear licensing (MIT)

### Data Retention
- **Species Observations**: Retain indefinitely (research value)
- **Environmental Mapping**: Retain indefinitely
- **Daily Reports**: Retain 2 years minimum
- **Logs**: Retain 90 days
- **Satellite Imagery URLs**: Expire after 30 days

### Geographic Data Sensitivity
- **Protected Species**: Truncate coordinates to 0.1° (~11km)
- **Endangered Species**: Do not share publicly
- **General Species**: Truncate to 0.001° (~110m)

---

## Security Resources

**Tools**:
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Remove sensitive data from Git
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [Safety](https://pyup.io/safety/) - Python dependency scanner
- [Dependabot](https://github.com/dependabot) - Automated dependency updates

**Documentation**:
- [Anthropic Security Best Practices](https://docs.anthropic.com/en/api/security)
- [OpenAI API Security](https://platform.openai.com/docs/guides/production-best-practices/api-security)
- [Airtable Security](https://airtable.com/security)
- [N8N Security](https://docs.n8n.io/hosting/security/)

**Monitoring**:
- [Have I Been Pwned API](https://haveibeenpwned.com/API) - Check for credential leaks
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning) - Automatic detection

---

## Contact

**Security Issues**: Use GitHub Security Advisories  
**General Questions**: Open GitHub issue (non-sensitive topics only)  
**Project Maintainer**: Andy Portalatin

---

## Acknowledgments

Security best practices informed by:
- OWASP Top 10
- NIST Cybersecurity Framework
- CIS Controls
- Cloud Security Alliance

---

**Last Updated**: November 27, 2025  
**Version**: 1.0  
**Review Schedule**: Quarterly
