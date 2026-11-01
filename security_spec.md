# Security Specification: StudyMate Firebase Security Model

## 1. Data Invariants
1. **User Identity Boundary**: Every document in `/users/{userId}` and its subcollections (`documents`, `summaries`, `quizzes`, `quizAttempts`) strictly belongs to `{userId}`. `request.auth.uid` MUST equal `{userId}`.
2. **Owner Immutability**: The `userId` field on all subcollection documents (`documents`, `summaries`, `quizzes`, `quizAttempts`) must be immutable once created, and must match `request.auth.uid`.
3. **No Cross-User Access**: No user may read, list, create, update, or delete any resource belonging to another user.
4. **ID Format Hardening**: All IDs (`userId`, `documentId`, `summaryId`, `quizId`, `attemptId`) must be valid alphanumeric identifiers up to 128 characters.
5. **No Shadow Fields**: Strict property whitelisting prevents injection of unverified escalation flags (e.g., `isAdmin: true` or `role: "admin"`).
6. **Payload Size Bounds**: Strings and arrays must have strict size boundaries to guard against Denial-of-Wallet resource exhaustion.

## 2. The Dirty Dozen Payloads (Target: PERMISSION_DENIED)

1. **Dirty 1: Spoofed User ID on Profile Create**
   - Attempt: User `attacker_123` attempts to write profile to `/users/victim_456`.
   - Result: PERMISSION_DENIED (`request.auth.uid != userId`).

2. **Dirty 2: Privilege Escalation in User Document**
   - Attempt: User `user_1` attempts to write `{ id: "user_1", role: "admin", isAdmin: true }` to `/users/user_1`.
   - Result: PERMISSION_DENIED (`keys().hasOnly` rejects unexpected keys).

3. **Dirty 3: Cross-User Document Injection**
   - Attempt: User `attacker_123` creates a document in `/users/victim_456/documents/doc_1`.
   - Result: PERMISSION_DENIED (`request.auth.uid != userId`).

4. **Dirty 4: Mismatched In-Payload userId**
   - Attempt: User `user_1` writes to `/users/user_1/documents/doc_1` with payload `{ userId: "victim_456" }`.
   - Result: PERMISSION_DENIED (`incoming().userId != userId || incoming().userId != request.auth.uid`).

5. **Dirty 5: Unauthenticated Read on Documents**
   - Attempt: `request.auth == null` attempts to `get` `/users/user_1/documents/doc_1`.
   - Result: PERMISSION_DENIED (`!isSignedIn()`).

6. **Dirty 6: Cross-User Summary Read**
   - Attempt: User `user_2` attempts to read `/users/user_1/summaries/sum_1`.
   - Result: PERMISSION_DENIED (`request.auth.uid != userId`).

7. **Dirty 7: Attempting to Mutate Immutable createdAt**
   - Attempt: User `user_1` updates `/users/user_1/documents/doc_1` altering `createdAt`.
   - Result: PERMISSION_DENIED (`incoming().createdAt == existing().createdAt` fails).

8. **Dirty 8: Attempting to Mutate Immutable userId**
   - Attempt: User `user_1` updates `/users/user_1/summaries/sum_1` changing `userId` to `user_2`.
   - Result: PERMISSION_DENIED (`incoming().userId == existing().userId` fails).

9. **Dirty 9: Oversized Malicious Text Injection (Denial of Wallet)**
   - Attempt: User `user_1` writes 2MB payload into `extractedText` on `/users/user_1/documents/doc_1`.
   - Result: PERMISSION_DENIED (`size() <= 500000` violation).

10. **Dirty 10: Quiz Attempt Score Spoofing Beyond Total**
    - Attempt: User `user_1` writes attempt with `score: 999` and `totalQuestions: 5`.
    - Result: PERMISSION_DENIED (`incoming().score <= incoming().totalQuestions`).

11. **Dirty 11: Wildcard Database Query Crawling**
    - Attempt: Unauthenticated or cross-user list collection group `/documents` or blanket query.
    - Result: PERMISSION_DENIED (Default deny catch-all `/{document=**}`).

12. **Dirty 12: ID Poisoning Attack with Special Characters**
    - Attempt: Writing to `/users/user_1/documents/<script>alert(1)</script>` or 1KB long ID.
    - Result: PERMISSION_DENIED (`isValidId()` constraint fails regex or size).
