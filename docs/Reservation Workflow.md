# Reservation Workflow

## Status Flow Diagram

```
Reservation Submitted (by Requester)
        ↓
      Pending
        ↓
Administrator Review
      ↓         ↓
 Approved    Rejected (terminal)
      ↓
  Scheduled
      ↓
   In Use (confirmed by Facility Staff)
      ↓
  Completed (recorded by Facility Staff)
```

## Status Definitions

| Status      | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| **Pending** | Reservation submitted, awaiting Administrator review.            |
| **Approved**| Administrator approved the request.                              |
| **Rejected**| Administrator rejected the request. Terminal state.              |
| **Scheduled**| Time slot is reserved after approval. (BR-B4-06)                |
| **In Use**  | Facility Staff confirmed the facility is being used.             |
| **Completed**| Facility Staff recorded the reservation as completed. (BR-B4-07)|
| **Cancelled**| Requester cancelled their own Pending request. (BR-B4-09)       |

## Valid Status Transitions

| From        | To          | Who Can Perform   |
| ----------- | ----------- | ----------------- |
| —           | Pending     | Requester         |
| Pending     | Scheduled   | Administrator     |
| Pending     | Rejected    | Administrator     |
| Pending     | Cancelled   | Requester (own)   |
| Scheduled   | In Use      | Facility Staff    |
| In Use      | Completed   | Facility Staff    |

## Notes

- **Approved → Scheduled** happens atomically in the `approve_reservation()` function.
- **Rejected** and **Completed** are terminal states — no further transitions allowed.
- **Cancelled** is a terminal state initiated only by the Requester for their own Pending requests.
- **BR-B4-05**: Rejected reservations cannot become Scheduled.
- **BR-B4-07**: Completed reservations cannot be edited.
- **BR-B4-10**: All status changes are recorded in the audit log.
