# TBOP V11 Installation

## 1. Run the SQL migration

Supabase > SQL Editor > New query

Open:
`supabase/migrations/v11_treasurer.sql`

Paste the entire SQL file and click Run.

Expected:
Success. No rows returned.

## 2. Upload V11 to GitHub

Upload the extracted V11 contents over `tbop-club-site1`.

## 3. Test

Sign in as Administrator, President, or Treasurer.

Officer Portal > Treasurer

Test:
- Add income
- Add expense
- Create a budget category
- Record a member dues payment
- Confirm dues payment creates an income ledger entry
- Confirm member dues status becomes Paid
- Filter transactions
- Print financial report

Financial RLS access:
- Treasurer
- President
- Administrator
