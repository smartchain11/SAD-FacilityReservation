# Business Rules

## Summary

| ID        | Business Rule                                   | Where Enforced                        |
| --------- | ----------------------------------------------- | ------------------------------------- |
| BR-B4-01  | Only active facilities may be reserved          | `submit_reservation()` + UI check     |
| BR-B4-02  | Reservation start must precede end time         | DB CHECK constraint + UI validation   |
| BR-B4-03  | Overlapping approved schedules are prohibited   | `submit_reservation()` + `approve_reservation()` |
| BR-B4-04  | Only Administrator may approve reservations     | `approve_reservation()` + RLS policy  |
| BR-B4-05  | Rejected reservations cannot become Scheduled   | Status transition validation in functions |
| BR-B4-06  | Approved reservations reserve the time slot     | `approve_reservation()` sets Scheduled |
| BR-B4-07  | Completed reservations cannot be edited         | UI hides action buttons + no update function |
| BR-B4-08  | Facilities under Maintenance cannot be reserved | `submit_reservation()` status check   |
| BR-B4-09  | Requesters may modify only their own Pending    | `cancel_reservation()` checks user_id |
| BR-B4-10  | Approval and status changes must be logged      | `log_audit()` called in all functions |

## Detailed Descriptions

### BR-B4-01: Only active facilities may be reserved
Before a reservation can be submitted, the system checks that the target facility's status is "Active". Facilities with any other status (e.g., "Under Maintenance") are blocked.

### BR-B4-02: Reservation start must precede end time
The `end_datetime` must be strictly after `start_datetime`. Enforced by:
- A `CHECK` constraint on the reservations table: `end_datetime > start_datetime`
- Client-side validation before form submission

### BR-B4-03: Overlapping approved schedules are prohibited
The system prevents double-booking by querying for existing Approved/Scheduled/In Use reservations that overlap with the requested time slot. Checked both at:
- Submission time (`submit_reservation()`)
- Approval time (`approve_reservation()`)

### BR-B4-04: Only Administrator may approve reservations
The `approve_reservation()` and `reject_reservation()` functions verify the caller's role is "administrator" before proceeding. Non-administrators receive an error.

### BR-B4-05: Rejected reservations cannot become Scheduled
Once a reservation is rejected, its status is terminal. The approval function only operates on "Pending" reservations.

### BR-B4-06: Approved reservations reserve the time slot
When an administrator approves a reservation, the status changes to "Scheduled", effectively reserving the time slot and preventing future conflicts.

### BR-B4-07: Completed reservations cannot be edited
Once marked as "Completed", no action buttons are shown in the UI, and no functions accept Completed reservations for status changes.

### BR-B4-08: Facilities under Maintenance cannot be reserved
The `submit_reservation()` function explicitly checks for "Under Maintenance" status and raises an exception if the facility is not available.

### BR-B4-09: Requesters may modify only their own Pending requests
The `cancel_reservation()` function compares `user_id` with `auth.uid()` and only allows cancellation if they match and the status is "Pending".

### BR-B4-10: Approval and status changes must be logged
Every status-changing function calls `log_audit()` to record the action in the `audit_logs` table, including: SUBMIT, APPROVE, REJECT, CANCEL, STATUS_CHANGE, COMPLETE, CREATE, UPDATE, DELETE.
