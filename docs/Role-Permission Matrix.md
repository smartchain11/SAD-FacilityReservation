# Role-Permission Matrix

## User Roles

| Role              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Administrator** | Full system access: manage facilities and users; approve/reject reservations; view service concerns, reports, and audit logs. |
| **Facility Staff**| Operational role: view reservations; confirm facility usage; record completion; create service requests; update facility condition. |
| **Requester**     | End-user role: view facilities; submit reservation requests; view status; cancel eligible own requests; view history. |

## Permission Matrix

| Function                          | Administrator | Facility Staff | Requester |
| --------------------------------- | :-----------: | :------------: | :-------: |
| Login / Logout                    | ✅            | ✅             | ✅        |
| View Dashboard                    | ✅            | ✅             | ✅        |
| Add Facility                      | ✅            | ❌             | ❌        |
| Edit Facility                     | ✅            | ❌             | ❌        |
| Delete Facility                   | ✅            | ❌             | ❌        |
| Update Facility Condition/Status  | ✅            | ✅             | ❌        |
| View All Facilities               | ✅            | ✅             | ✅        |
| Submit Reservation Request        | ❌            | ❌             | ✅        |
| Approve Reservation               | ✅            | ❌             | ❌        |
| Reject Reservation                | ✅            | ❌             | ❌        |
| Confirm Facility Usage (In Use)   | ✅            | ✅             | ❌        |
| Record Completion                 | ✅            | ✅             | ❌        |
| Cancel Own Pending Request        | ❌            | ❌             | ✅        |
| View All Reservations             | ✅            | ✅             | ❌        |
| View Own Reservations             | ✅            | ✅             | ✅        |
| View Audit Logs                   | ✅            | ❌             | ❌        |
| Search & Filter Records           | ✅            | ✅             | ✅        |

## Enforcement Mechanisms

| Mechanism              | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| **Supabase RLS**       | Row Level Security policies restrict data access by role |
| **PL/pgSQL Functions** | SECURITY DEFINER functions enforce business rules atomically |
| **UI Controls**        | Buttons and actions shown/hidden based on user role      |
| **Auth Guard**         | `requireAuth()` redirects unauthenticated users to login |
