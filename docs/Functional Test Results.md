# Functional Test Results

## Requirements Traceability Matrix

| Requirement ID | Functional Requirement  | Implemented Feature              | Test Case  | Test Result |
| -------------- | ----------------------- | -------------------------------- | ---------- | ----------- |
| FR-01          | Submit Reservation      | Reservation form + RPC           | TC-B4-01   | PASS        |
| FR-02          | Conflict Detection      | Overlap query in functions       | TC-B4-02   | PASS        |
| FR-03          | Approve Reservation     | Admin approve button + RPC       | TC-B4-03   | PASS        |
| FR-04          | Reject Reservation      | Admin reject button + RPC        | TC-B4-04   | PASS        |
| FR-05          | Mark In Use             | Staff In Use button + RPC        | TC-B4-05   | PASS        |
| FR-06          | Complete Reservation    | Staff Complete button + RPC      | TC-B4-06   | PASS        |
| FR-07          | Edit Protection         | No action buttons for others     | TC-B4-07   | PASS        |
| FR-08          | Maintenance Block       | Submit blocked for maintenance   | TC-B4-08   | PASS        |
| FR-09          | Audit Logging           | audit_logs table + viewer        | TC-B4-09   | PASS        |
| FR-10          | Access Control          | Auth guard + RLS                 | TC-B4-10   | PASS        |

## Functional Test Cases

| Test ID   | Test Scenario                     | Expected Result                                          | Actual Result                          | Status |
| --------- | --------------------------------- | -------------------------------------------------------- | -------------------------------------- | ------ |
| TC-B4-01  | Requester submits reservation     | Saved as Pending                                         | Reservation saved with Pending status  | PASS   |
| TC-B4-02  | Submit overlapping schedule       | Conflict detected and blocked                            | Error: "Overlapping approved schedule detected" | PASS |
| TC-B4-03  | Administrator approves request    | Status becomes Scheduled                                 | Status changed to Scheduled            | PASS   |
| TC-B4-04  | Administrator rejects request     | Status becomes Rejected                                  | Status changed to Rejected             | PASS   |
| TC-B4-05  | Staff marks facility In Use       | Status updated to In Use                                 | Status changed to In Use               | PASS   |
| TC-B4-06  | Staff completes reservation       | Status becomes Completed                                 | Status changed to Completed            | PASS   |
| TC-B4-07  | Requester edits another's request | Blocked                                                  | Error: "You can only cancel your own"  | PASS   |
| TC-B4-08  | Reserve facility under maintenance| Blocked                                                  | Error: "Facility is under maintenance" | PASS   |
| TC-B4-09  | Check audit log                   | Approval/status log visible                              | All actions recorded in audit_logs     | PASS   |
| TC-B4-10  | Open protected page without login | Access denied                                            | Redirected to login page               | PASS   |

## Business Rule Verification

| Rule      | Test                                             | Result                              | Status |
| --------- | ------------------------------------------------ | ----------------------------------- | ------ |
| BR-B4-01  | Reserve an inactive facility                     | Blocked by submit_reservation()     | PASS   |
| BR-B4-02  | Set end time before start time                   | Blocked by CHECK + UI               | PASS   |
| BR-B4-03  | Submit overlapping approved reservation          | Blocked by overlap query            | PASS   |
| BR-B4-04  | Non-admin tries to approve                       | Error raised by function            | PASS   |
| BR-B4-05  | Try to schedule a rejected reservation           | Blocked (only Pending can approve)  | PASS   |
| BR-B4-06  | Approved reservation reserves time slot          | Verified after TC-B4-03             | PASS   |
| BR-B4-07  | Try to modify completed reservation              | No action buttons displayed         | PASS   |
| BR-B4-08  | Reserve facility under maintenance               | Blocked with error message          | PASS   |
| BR-B4-09  | Requester cancels another user's request         | Blocked by user_id check            | PASS   |
| BR-B4-10  | Check audit log after actions                    | All actions logged with details     | PASS   |
