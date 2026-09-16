# Role-Based Facility Reservation and Approval System

**Course:** Systems Analysis and Design (SAD Lab 4 Section B)  
**Repository:** `SAD-FacilityReservation`  
**Live System:** _Deploy to GitHub Pages after setup_

A full-stack web application for managing facility reservations with role-based
access control, approval workflows, schedule conflict detection, and audit
logging.

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Front End | HTML, CSS, JavaScript                           |
| Hosting   | GitHub Pages                                    |
| Backend   | Supabase (PostgreSQL + Authentication)          |

---

## Features

1. **User Authentication** – Login, Logout, session management with 3 roles.
2. **Role-Based Access** – Administrator, Facility Staff, Requester permissions.
3. **Dashboard** – Summary statistics (Total, Active, Maintenance, Pending, In Use, Completed).
4. **Facility Management (CRUD)** – Add, view, edit, delete facilities (Admin).
5. **Reservation Submission** – Requester submits reservation with date/time.
6. **Approval Workflow** – Admin approves/rejects pending reservations.
7. **Schedule Conflict Detection** – Prevents overlapping approved schedules (BR-B4-03).
8. **Status Workflow** – Pending → Approved → Scheduled → In Use → Completed.
9. **Cancel Own Requests** – Requester can cancel their own Pending requests.
10. **Facility Condition** – Staff can set facilities to Active or Under Maintenance.
11. **Audit Trail** – All critical actions logged for accountability (BR-B4-10).
12. **Search & Filter** – By facility name, requester, status, and type.

---

## Getting Started

### 1. Set up the Supabase backend

1. Go to https://supabase.com and create a new project.
2. Open **SQL Editor** → paste the whole content of `supabase/schema.sql` → **Run**.
   This creates the `profiles`, `facilities`, `reservations`, and `audit_logs`
   tables, enables **Row Level Security**, and creates all the atomic PL/pgSQL
   functions.
3. Open **Authentication → Providers → Email**: if you want instant account
   creation without email confirmation, disable **"Confirm email"**.
4. Open **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.

### 2. Configure the application

Open `js/config.js` and paste your credentials:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

### 3. Test locally

Open `index.html` in a browser (double-click the file), create an account, and sign in.

### 4. Deploy to GitHub Pages

1. Create a new repository (public).
2. Upload the whole project folder to the repository.
3. GitHub → **Settings → Pages** → Source: **Deploy from a branch** → branch `main` → `/` (root) → **Save**.
4. Wait a minute, then open your GitHub Pages URL.

---

## Database Design

**Table 1: `profiles`**

| Field       | Data Type   | Description                          |
| ----------- | ----------- | ------------------------------------ |
| `id`        | UUID        | Primary key (matches auth.users)     |
| `role`      | text        | administrator / facility_staff / requester |
| `created_at`| timestamptz | Account creation date                |

**Table 2: `facilities`**

| Field            | Data Type   | Description                          |
| ---------------- | ----------- | ------------------------------------ |
| `id`             | bigint      | Primary key                          |
| `facility_name`  | text        | Name of the facility                 |
| `facility_type`  | text        | Type (Conference Room, Lab, etc.)    |
| `capacity`       | integer     | Maximum occupancy                    |
| `location`       | text        | Building/floor location              |
| `description`    | text        | Optional description                 |
| `status`         | text        | Active / Under Maintenance           |
| `created_at`     | timestamptz | Record creation date                 |

**Table 3: `reservations`**

| Field             | Data Type   | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| `id`              | bigint      | Primary key                          |
| `facility_id`     | bigint      | FK → facilities                      |
| `requester_name`  | text        | Name of the requester                |
| `department`      | text        | Department/office                    |
| `purpose`         | text        | Purpose of reservation               |
| `start_datetime`  | timestamptz | Reservation start                    |
| `end_datetime`    | timestamptz | Reservation end                      |
| `status`          | text        | Pending/Approved/Rejected/Scheduled/In Use/Completed/Cancelled |
| `approved_by`     | UUID        | Admin who approved                   |
| `approved_at`     | timestamptz | Approval timestamp                   |
| `user_id`         | UUID        | User who submitted                   |
| `created_at`      | timestamptz | Record creation date                 |

**Table 4: `audit_logs`**

| Field          | Data Type   | Description                          |
| -------------- | ----------- | ------------------------------------ |
| `id`           | bigint      | Primary key                          |
| `action`       | text        | SUBMIT/APPROVE/REJECT/CANCEL/etc.    |
| `target_table` | text        | Table affected                       |
| `target_id`    | bigint      | Record ID affected                   |
| `details`      | text        | Human-readable description           |
| `performed_by` | UUID        | User who performed action            |
| `performed_at` | timestamptz | Timestamp                            |

**Relationships:**
- One `facility` may appear in many `reservations` (1:N).
- Each `reservation` references one `facility`.

---

## User Roles (Role-Permission Matrix)

| Function                     | Administrator | Facility Staff | Requester |
| ---------------------------- | :-----------: | :------------: | :-------: |
| View dashboard               | ✅            | ✅             | ✅        |
| Manage facilities (CRUD)     | ✅            | ❌             | ❌        |
| Update facility condition    | ✅            | ✅             | ❌        |
| View facilities              | ✅            | ✅             | ✅        |
| Submit reservation           | ❌            | ❌             | ✅        |
| Approve/reject reservations  | ✅            | ❌             | ❌        |
| Confirm facility usage       | ✅            | ✅             | ❌        |
| Record completion            | ✅            | ✅             | ❌        |
| Cancel own pending request   | ❌            | ❌             | ✅        |
| View all reservations        | ✅            | ✅             | ❌        |
| View own reservations        | ❌            | ❌             | ✅        |
| View audit logs              | ✅            | ❌             | ❌        |

---

## Reservation Workflow

```
Reservation Submitted
        ↓
      Pending
        ↓
Administrator Review
        ↓
 Approved / Rejected
        ↓
If Approved → Scheduled → In Use → Completed
```

Required statuses: Pending, Approved, Rejected, Scheduled, In Use, Completed, Cancelled.

---

## Business Rules

| ID        | Business Rule                                   | Where Enforced            |
| --------- | ----------------------------------------------- | ------------------------- |
| BR-B4-01  | Only active facilities may be reserved          | `submit_reservation()` + UI |
| BR-B4-02  | Reservation start must precede end time         | DB CHECK + UI validation  |
| BR-B4-03  | Overlapping approved schedules are prohibited   | `submit_reservation()` + `approve_reservation()` |
| BR-B4-04  | Only Administrator may approve reservations     | `approve_reservation()` + RLS |
| BR-B4-05  | Rejected reservations cannot become Scheduled   | Status check in functions |
| BR-B4-06  | Approved reservations reserve the time slot     | `approve_reservation()`   |
| BR-B4-07  | Completed reservations cannot be edited         | UI + no action buttons    |
| BR-B4-08  | Facilities under Maintenance cannot be reserved | `submit_reservation()` + UI |
| BR-B4-09  | Requesters may modify only their own Pending    | `cancel_reservation()` + RLS |
| BR-B4-10  | Approval and status changes must be logged      | `log_audit()` in all functions |

---

## Requirements Traceability Matrix

| Requirement | Feature              | Test Case |
| ----------- | -------------------- | --------- |
| FR-01       | User Login           | TC-B4-10  |
| FR-02       | Submit Reservation   | TC-B4-01  |
| FR-03       | Conflict Detection   | TC-B4-02  |
| FR-04       | Approve Reservation  | TC-B4-03  |
| FR-05       | Reject Reservation   | TC-B4-04  |
| FR-06       | Mark In Use          | TC-B4-05  |
| FR-07       | Complete Reservation | TC-B4-06  |
| FR-08       | Edit Protection      | TC-B4-07  |
| FR-09       | Maintenance Block    | TC-B4-08  |
| FR-10       | Audit Logging        | TC-B4-09  |

---

## Project Structure

```
SAD-FacilityReservation/
├── index.html            # Login / Sign-up page
├── dashboard.html        # Dashboard with summary statistics
├── facilities.html       # Facility management + reserve
├── reservations.html     # Reservation workflow management
├── audit-logs.html       # Audit trail (Admin only)
├── css/style.css         # Styles
├── js/
│   ├── config.js         # SUPABASE_URL and anon key (edit this)
│   ├── common.js         # Toasts, auth guard, formatting helpers
│   ├── auth.js           # Login / sign-up logic
│   ├── facilities.js     # Facility module
│   ├── reservations.js   # Reservation workflow module
│   ├── dashboard.js      # Dashboard module
│   └── audit-logs.js     # Audit log viewer
├── supabase/schema.sql   # Database schema, RLS policies, functions
├── docs/                 # SAD documents and diagrams
└── README.md
```

---

## Submitted by

**Name:** _Your Name_ · **Section:** BSIT — Section B
