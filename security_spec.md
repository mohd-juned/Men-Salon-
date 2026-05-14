# Shabnam Men's Salon Security Specification

## Data Invariants
- A booking must always start in 'pending' status.
- Bookings can only be read/updated by the admin (authorized email).
- Salon configuration is publicly readable but only editable by the admin.
- Timestamps must be validated against server time.

## The Dirty Dozen Payloads (Rejections)
1. Creating a booking that is already 'accepted'.
2. Updating someone else's booking status as a non-admin.
3. Injecting extra fields (isVerified, isAdmin) into a booking.
4. Setting a fake 'createdAt' timestamp from the client.
5. Deleting bookings (not allowed).
6. Reading all bookings as a subscriber/anonymous user.
7. Modifying salon address as a regular user.
8. Using an oversized string for 'name' (> 100 chars).
9. Malformed phone numbers.
10. Spoofing admin email without verification.
11. Reading specific booking by ID without admin auth.
12. Attempting to update 'createdAt' field.
