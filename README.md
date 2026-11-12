# WVUSD Field Trip & Permission Slip Management System
**Walnut Valley Unified School District (WVUSD)**

A modern, production-ready Google Apps Script web application designed to replace the district's field trip request and parent/volunteer permission slip workflows.

---

## 🏛️ System Architecture

### 1. Data Stores (Google Sheets)
* **Master Sheet ID:** `1pgMvIwsmB2I9-gN3OOqC2MavmRQ745gTeGOLXwQiJRY`
  * `Requests`: 48-column comprehensive trip record, timestamps, logistics, compliance, and locking state.
  * `Approval_Logs`: Complete chronological audit trail (`Log_ID`, `Request_ID`, `Timestamp`, `Actor_Email`, `Actor_Role`, `Action`, `Comment_Text`, `Stage_From`, `Stage_To`).
  * `Site_Directory`: Pre-populated directory of 18 WVUSD school sites, Principals, Admin Assistants, and Nurses.
  * `Deans`: Directory of high school and middle school deans for administrative routing.
  * `District_Config`: Role-based email distribution lists (`OPS_SECRETARY`, `TRANSPORTATION`, `HR_PERSONNEL`, `OPS_DIRECTOR`, `PERMISSION_SLIPS_FOLDER_ID`).
* **Slips Sheet ID:** `1ShpLkohU2iCpgkVRp_t3cDR0uWiCil0o_6ewcWLR64M`
  * `Student_Slips`: 27-column parent permission slip records with meal requests, insurance clearance, and medical alerts.
  * `Volunteer_Slips`: 16-column adult chaperone/volunteer registration records.

### 2. Multi-Recipient Support
All email lookup fields (Admin Assistants, Principals, Deans, Nurses, Operations Secretary, Transportation, HR Personnel, Operations Director, Co-Teachers) support **comma-separated email lists**. The system trims whitespace, grants review rights to all listed emails, and dispatches automated notifications to every recipient.

### 3. Public vs. Authenticated Route Security
* **Staff Portal (`?view=portal` or root):** Authenticated Google session verified server-side (`Session.getActiveUser().getEmail()`). Strict `@wvusd.org` domain enforcement.
* **Parent Permission Slip (`?view=slip&reqId=FT-YYYY-XXXX`):** Publicly accessible without Google login. Strictly scoped to read-only trip header details. Appends submissions to `Student_Slips`. Never exposes student rosters or medical notes to the public.
* **Volunteer Permission Slip (`?view=volunteer&reqId=FT-YYYY-XXXX`):** Publicly accessible without Google login. Appends chaperone submissions to `Volunteer_Slips`.

---

## 📁 Project Structure

```
wvusd-field-trips/
├── appsscript.json        # Manifest with Los Angeles timezone, webapp config, and OAuth scopes
├── .clasp.json            # Google clasp project configuration
├── .claspignore           # Build file filter for clean clasp deployments
├── Config.js              # Hardcoded Sheet IDs, branding URLs, status & stage constants
├── Setup.js               # One-click setupSheets() initialization function
├── Auth.js                # @wvusd.org domain enforcement and role resolution
├── DriveService.js        # Base64 file upload handler for rosters and insurance cards
├── VisionService.js       # Google Cloud Vision TEXT_DETECTION OCR integration
├── EmailService.js        # Multi-recipient HTML notifications and Instant Nurse Alerts
├── Approvals.js           # Multi-step approval chain, comment loops, and hard locking
├── Requests.js            # Request creation, updates, revision mode, and query filters
├── Slips.js               # Public header retrieval, student/volunteer slip processing, CSV export
├── Code.js                # Web app controller (doGet) and initial bundle loader
├── Index.html             # Staff/Admin Portal (Alpine.js + Tailwind CSS)
├── StudentSlip.html       # Parent Permission Slip (Alpine.js + Tailwind CSS)
└── VolunteerSlip.html     # Volunteer Permission Slip (Alpine.js + Tailwind CSS)
```

---

## 🚀 One-Click Sheet Initialization

To initialize the tabs, headers, frozen header rows, and pre-populated site directories:

1. Open your Apps Script project linked to this repository.
2. Select `Setup.js` in the editor.
3. Select `setupSheets` from the function dropdown.
4. Click **Run**.
5. Both Google Sheets (`MASTER_SHEET_ID` and `SLIPS_SHEET_ID`) will be automatically formatted and pre-populated with:
   * 18 WVUSD School Sites (Principals, Admin Assistants, Nurses)
   * 8 Deans
   * District Configuration Keys

---

## ⚙️ Google Cloud Vision API Setup (Optional)

To enable automatic OCR on insurance card photos:
1. In the Apps Script project editor, go to **Project Settings** (gear icon) > **Script Properties**.
2. Click **Add script property**:
   * **Property:** `VISION_API_KEY`
   * **Value:** Your Google Cloud Vision API Key
3. Click **Save script properties**.

*(Note: If `VISION_API_KEY` is not configured, the application continues to run seamlessly and logs `OCR skipped` without disrupting parent submissions).*

---

## 📬 Automated Approval Workflow Chain

The approval sequence automatically skips any stage where emails are blank or Dean is "Not Applicable":

```
[1. Teacher Submits Request]
           │
           ▼
[2. Site Admin Assistant] (Site_Directory Col E)
           │
           ▼
[3. Dean] (Deans Col B — Mandatory if assigned or DBHS/WHS Athletics)
           │
           ▼
[4. Site Principal] (Site_Directory Col C)
           │
           ▼
[5. Operations Secretary] (District_Config: OPS_SECRETARY)
           │
           ▼
[6. Transportation] (Triggered if School Bus, Charter Bus, Rental, or Flight/Train bus TF#)
           │
           ▼
[7. HR Personnel] (Triggered if Volunteer Count > 0 or Cleared Volunteers listed)
           │
           ▼
[8. Operations Director] (Final Approval — Sets Status to "Approved (Complete)" & Locks Request)
```

### Bidirectional Revision Loop
* An approver can click **"Request Changes / Comment"** to unlock the request, set Status to `Action Required (Teacher Edit)`, and dispatch an email with their notes to the teacher and co-teachers.
* The teacher revises the form and clicks **"Resubmit"**, returning the request to the review queue and notifying the approver.
* When Status reaches `Approved (Complete)` or `Declined`, `Locked_Boolean` is set to `TRUE`, blocking all future edits.

---

## 🚨 Instant Nurse Alert
When a parent submits a permission slip indicating that their child has medical needs or requires medication:
* The system instantly resolves the Site Nurse email from `Site_Directory`.
* An urgent, branded **Nurse Alert** email is dispatched immediately with student ID, medical details, medication location, and trip schedule.
* The exact timestamp is logged in `Nurse_Notified_Timestamp`.
* In the Teacher Roster table, students are marked with a `Medical Alert - Nurse Notified` badge without exposing sensitive notes.

---

## 💻 Deployment with `clasp`

### 1. Clasp Login & Script Link
```bash
# Log in with your WVUSD Google Workspace account
clasp login

# Link your script ID (or create a new web app)
clasp clone "<YOUR_APPS_SCRIPT_ID>"
```

### 2. Push Code
```bash
clasp push
```

### 3. Deploy Web Application
```bash
clasp deploy --description "WVUSD Field Trip System v1.0"
```
Ensure deployment access is set to:
* **Execute as:** `User deploying the web app` (or District Admin)
* **Who has access:** `Anyone` (required so parents/volunteers can submit slips without needing a district Google login).
