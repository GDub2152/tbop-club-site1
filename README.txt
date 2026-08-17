THE BLOWTORCH OF PARMA - SELF-CONTAINED PUBLIC WEBSITE
=====================================================

This version is deliberately standalone.

It DOES NOT use:
- Supabase or any database
- Admin/member login systems
- Remote APIs
- NOAA live feeds
- Embedded outside maps
- CDN scripts or styles
- Remote fonts or remote images

Everything needed to display the website is included in this folder.
It can be hosted on GitHub Pages or almost any ordinary static web server.

FILES TO EDIT
-------------
script.js
  - EVENTS list controls the public calendar.
  - NEWS list controls the public news feed.

Documents
  - Add public PDFs/files to the documents folder.
  - Add matching links manually to documents.html.

Logo
  - assets/tbop-logo.png

Homepage
  - index.html

No build process is required. index.html is the homepage.
