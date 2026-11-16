# Walnut Valley Unified School District (WVUSD)
## Field Trip & Permission Slip Management System

A production-ready, two-part field trip management solution for Walnut Valley Unified School District (WVUSD):
1. **`/gas-backend`**: Google Apps Script backend connected to Google Sheets & Google Drive, managed via `clasp`.
2. **`/staff-portal`**: Modern React + Vite + Tailwind CSS web application configured for deployment on GitHub Pages with Google Workspace (`@wvusd.org`) Single Sign-On.

Branded with the official WVUSD district logo:  
`https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png`

---

## 🏛️ System Architecture

```
wvusd-field-trips/
├── gas-backend/                  # Google Apps Script Backend (clasp)
│   ├── .clasp.json               # Script ID: 1G9JImS7RY72lkZ0Eg9k6X4ZijUu7PG5-2IlC2I9MlI-2rfR7GQ7f8Ywv
│   ├── appsscript.json           # Timezone (America/Los_Angeles), OAuth Scopes, Web App config
│   ├── Config.js                 # Sheet IDs, Statuses, Stages, and Comma-Separated Email Utilities
│   ├── Setup.js                  # setupSheets() One-Click Initializer for both sheets
│   ├── Api.js                    # doGet (public slips) & doPost (secure JSON API for Vite)
│   ├── Approvals.js              # 7-Stage Sequential State Machine & Pipeline Calculator
│   ├── Requests.js               # Field trip requests, revisions, and query filters
│   ├── Slips.js                  # Public headers, Student/Volunteer slips, and Cafeteria CSV
│   ├── DriveService.js           # Restricted Drive folder upload (no public link sharing)
│   ├── EmailService.js           # Multi-recipient HTML notifications & Instant Nurse Alerts
│   ├── VisionService.js          # Google Cloud Vision OCR for insurance card verification
│   ├── StudentSlip.html          # Public Parent Permission Slip
│   └── VolunteerSlip.html        # Public Volunteer Chaperone Registration
│
├── staff-portal/                 # React + Vite + Tailwind CSS Frontend (GitHub Pages)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # District header, role pills, and API endpoint config
│   │   │   ├── LoginGate.jsx         # Sign in with Google (@wvusd.org) + Role Simulator
│   │   │   ├── TeacherDashboard.jsx  # Trip cards, horizontal stage progress, slip copiers
│   │   │   ├── NewTripModal.jsx      # 73-question form, Day vs Overnight & Transport branching
│   │   │   ├── RosterModal.jsx       # Student roster, meal counts, Google Classroom button
│   │   │   ├── ApproverDashboard.jsx # HR-style visual pipeline tracker & Sequential Gate
│   │   │   └── TripDetailDrawer.jsx  # Slide-over summary, Approval_Logs audit trail & actions
│   │   ├── api.js                    # Client service talking to GAS API (with demo fallbacks)
│   │   ├── App.jsx                   # Role-aware routing & session management
│   │   ├── main.jsx                  # React DOM mount point
│   │   └── index.css                 # Tailwind directives and clean typography
│   ├── index.html                # Google Identity Services & Classroom platform scripts
│   ├── vite.config.js            # base: './' for GitHub Pages compatibility
│   └── package.json
│
└── .github/workflows/
    └── deploy.yml                # Automated GitHub Actions workflow to deploy to GitHub Pages
```

---

## ⚙️ Data Stores (Google Sheets)

* **Master Sheet ID:** `1pgMvIwsmB2I9-gN3OOqC2MavmRQ745gTeGOLXwQiJRY`
  * `Requests`: 48-column record storing trip schedule, branching logistics, counts, and hard locking.
  * `Approval_Logs`: Complete chronological audit trail (`Log_ID`, `Request_ID`, `Timestamp`, `Actor_Email`, `Actor_Role`, `Action`, `Comment_Text`, `Stage_From`, `Stage_To`).
  * `Site_Directory`: Pre-populated directory of 18 WVUSD school sites, Principals, Admin Assistants, and Nurses (no Athletic Director columns).
  * `Deans`: Directory of 8 high school and middle school deans.
  * `District_Config`: Distribution lists for district roles (`OPS_SECRETARY`, `TRANSPORTATION`, `HR_PERSONNEL`, `OPS_DIRECTOR`, `PERMISSION_SLIPS_FOLDER_ID`).
* **Slips Sheet ID:** `1ShpLkohU2iCpgkVRp_t3cDR0uWiCil0o_6ewcWLR64M`
  * `Student_Slips`: 27-column parent permission slip records with meal requests, insurance clearance, and medical alerts.
  * `Volunteer_Slips`: 16-column adult chaperone registration records.

### One-Click Sheet Initialization
1. In your Apps Script editor, open `Setup.js`.
2. Select `setupSheets` from the function dropdown and click **Run**.
3. All tabs, headers, navy formatting, frozen rows, and directories will be automatically configured.

---

## 🔒 Security & Access Control

1. **Google ID Token Verification (`Api.js`)**:
   * Every staff/approver action sent from the Vite frontend to `doPost(e)` verifies the Google ID token against `https://oauth2.googleapis.com/tokeninfo?id_token=`.
   * Enforces `email_verified == true` and `hd == "wvusd.org"`.
   * Cross-origin requests use `Content-Type: text/plain` to prevent CORS preflight blocks.
2. **Sequential Approval State Machine**:
   * **Stage 1:** Site Admin Assistant (`Site_Directory` Col E)
   * **Stage 2:** Dean (`Deans` Col B — auto-assigned **Kurt Davies** for DBHS Athletics, **Valerie Varela** for Walnut HS Athletics, or skipped if "Not Applicable")
   * **Stage 3:** Site Principal (`Site_Directory` Col C)
   * **Stage 4:** Operations Secretary (`District_Config` OPS_SECRETARY)
   * **Stage 5:** Transportation (`District_Config` TRANSPORTATION — triggered if School Bus, Charter Bus, Rental, or bus TF#)
   * **Stage 6:** HR Personnel (`District_Config` HR_PERSONNEL — triggered if Volunteers > 0 or cleared volunteers listed)
   * **Stage 7:** Operations Director (`District_Config` OPS_DIRECTOR — final approval)
3. **Sequential Gate Enforcement**:
   * In the Approver Dashboard, all trips assigned to an approver's site or department are visible in a unified pipeline, but **Approve / Request Changes / Decline** action buttons are strictly disabled unless `trip.Current_Stage` matches that logged-in user's role.
4. **Bidirectional Comment Loop & Hard Locking**:
   * Clicking **"Request Changes / Comment"** sets status to `Action Required (Teacher Edit)` and unlocks the form for teacher revision while pausing at that exact approver's stage.
   * Upon teacher resubmission, the request returns to that approver's review queue.
   * Final approval (`Approved (Complete)`) or decline sets `Locked_Boolean = TRUE`, rejecting any future modification attempts.
5. **Instant Nurse Alert**:
   * When a parent selects `Yes` to Medical Needs or Medication Required on `StudentSlip.html`, an instant high-priority email alert is dispatched to the Site Nurse (`Site_Directory` Col G) with student ID, medication location, and trip details, and the timestamp is recorded in `Nurse_Notified_Timestamp`.
6. **Restricted Drive Storage**:
   * Roster attachments and insurance card photos are saved directly into the district Google Drive folder without public link sharing.

---

## 🚀 Deployment Instructions

### 1. Deploy the Backend via `clasp`
```bash
cd gas-backend
clasp login
clasp push
```
In the Google Apps Script UI:
* Click **Deploy** > **New deployment** > **Web app**.
* Set **Execute as:** `User deploying the web app`.
* Set **Who has access:** `Anyone`.
* Copy the resulting Web App URL (e.g. `https://script.google.com/macros/s/.../exec`).

### 2. Run the Staff Portal Locally
```bash
cd staff-portal
npm install
npm run dev
```

### 3. Deploy Staff Portal to GitHub Pages
1. Push this repository to your GitHub organization (`main` branch).
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Build and deployment**, select **Source: GitHub Actions**.
4. The workflow in [`.github/workflows/deploy.yml`](file:///home/kwendland/wvusd-field-trips/.github/workflows/deploy.yml) will automatically build and publish the portal.
5. In the deployed portal, click the **Settings** (gear icon) in the navigation bar and paste your published Apps Script Web App URL!
