# Security Architecture Notes

## Public GitHub Repository
Safe for:
- HTML/CSS/JS
- Public images
- Public bylaws
- Public newsletters
- Public calendar data if intentionally published

Not safe for:
- Secrets
- Credentials
- Private documents
- Real ballots
- Financial records
- Member personal data

## Officer Portal Production Roles

Suggested permissions:

### President
Broad administrative access.

### Vice President
Broad operational access, limited financial controls unless granted.

### Secretary
Meetings, agendas, minutes, correspondence, membership records as needed.

### Treasurer
Dues, financial reports, budgets, restricted financial records.

### Sergeant at Arms
Meeting/event operational tools and permissions assigned by policy.

### Trustees
Governance documents, board records, voting administration as appropriate.

### Repeater Trustee
Repeater maintenance, technical documents, outages, inventory, programming/configuration files.

## Voting
Recommended:
- One authenticated vote per eligible member
- Eligibility table separated from ballot table
- Secret-ballot mode
- Opening and closing timestamp
- Administrative audit log
- Optional turnout display
- Ability to archive/remove completed votes
- No ballot choices stored in GitHub
