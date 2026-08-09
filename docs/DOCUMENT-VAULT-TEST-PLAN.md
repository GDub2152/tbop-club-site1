# Document Vault Test Plan

Use disposable test documents only.

## Test users
Create one account for:
1. Member
2. President
3. Vice President
4. Secretary
5. Treasurer
6. Sergeant at Arms
7. Trustee
8. Repeater Trustee
9. Technical Admin

## Test files
- small PDF
- PNG/JPEG
- DOCX
- ZIP
- text file
- disallowed executable file
- file over 50 MB

## Minimum scenarios
1. Executive uploads a Member document.
2. Member downloads it through a signed URL.
3. Member attempts to upload and is denied.
4. Executive uploads a Financial document.
5. Member and Repeater Trustee are denied.
6. Treasurer is allowed.
7. Repeater Trustee uploads technical documentation into Repeater.
8. Repeater Trustee is denied access to Financial.
9. Upload a second version and confirm the first still exists.
10. Move a document to trash and confirm normal listings hide it.
11. Restore the document.
12. Verify audit events.
13. Verify an expired signed URL no longer works.
14. Verify anonymous browsing cannot reach Storage objects.

Record actual results in a release-candidate test report.
