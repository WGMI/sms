Simple School Management (Demo)

Files:
- index.html — main demo UI
- app.js — client logic and localStorage persistence
- style.css — minimal styles

Usage:
1. Open `index.html` in your browser.
2. Use the nav to switch between Enrol, Fees, Courses, Staff, Results.
3. All data is stored in the browser `localStorage` (no server).
4. Export results from the Results panel using the "Export Results" button.
 
Multitenancy notes:

- The demo now supports multiple schools (tenants) in a single browser using namespaced `localStorage` keys.
- Use the School selector in the header to switch between schools, or create a new school with the input + `Create` button.
- Each school's data (students, fees, courses, staff, results) is isolated under a namespaced key `sms_demo:<tenant-id>`.

This is intentionally minimal for demonstration purposes.
