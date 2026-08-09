# Login Split 2.4

This release separates authentication entry points:

- `member-login.html` — general Member Portal
- `officer-login.html` — Officer Portal
- `login.html` — chooser page

Officer Login includes a role dropdown. In real Supabase mode the selected role
is verified against the account's actual `profiles.role`; selecting a role does
not grant permissions.

Member Login always enters the member-facing portal. Officers can still use
Member Login if they want to see the member experience.

No Supabase migration is required for this UI/auth routing patch.
