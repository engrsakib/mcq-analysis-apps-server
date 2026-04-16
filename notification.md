# Notification System and Save Token Guide

This document is for Flutter and backend developers. It explains how notification events are generated, processed, stored, pushed by Firebase, and consumed by mobile clients.

## 1) High-Level Overview

### What this system does

- Converts important backend actions into notification events.
- Processes events through EventBus + JobQueue + Worker.
- Saves notifications into database for in-app history.
- Sends push notifications to user devices using Firebase Cloud Messaging.
- Lets Flutter app fetch notification history and unread state from API.

### Modules that send notifications

- study-plan
- youtube
- result
- books
- exam
- guideline

### End-to-end flow (simple)

User Action -> API -> Service -> EventBus -> JobQueue -> Worker -> Notification Handler -> Notification DB + Firebase Push -> Flutter App

### ASCII architecture diagram

```text
+-------------------+
| User Action       |
| (create/update)   |
+---------+---------+
          |
          v
+---------+---------+        publish(event)       +-------------------+
| API + Service     | ---------------------------> | EventBus          |
| (module logic)    |                              +---------+---------+
+---------+---------+                                        |
          |                                                  v
          |                                        +---------+---------+
          |                                        | JobQueue          |
          |                                        +---------+---------+
          |                                                  |
          |                                                  v
          |                                        +---------+---------+
          |                                        | Worker Dispatcher |
          |                                        +---------+---------+
          |                                                  |
          |                                                  v
          |                                     +------------+------------+
          |                                     | Notification Handler    |
          |                                     | - getUserFcmToken       |
          |                                     | - sendPushNotification  |
          |                                     | - save notification DB  |
          |                                     +-------+-----------+-----+
          |                                             |           |
          v                                             v           v
                                      +----------------+--+    +---+----------------+
                                      | Mongo Notification |    | Firebase Admin FCM |
                                      +-------------------+    +---------+-----------+
                                                                        |
                                                                        v
                                                             +----------+----------+
                                                             | Flutter App         |
                                                             | Foreground/Background|
                                                             +---------------------+
```

## 2) Save Token API (FCM Device Token)

### 2.1 Purpose

An FCM token is a unique device push address issued by Firebase for one app installation.

Why backend must store it:

- Worker needs this token to call Firebase and target the right device.
- Without token, push notification cannot be delivered.
- Token changes over time (reinstall, app data clear, OS refresh), so app must re-save it.

Important rule:

- No valid token in backend means no mobile push, even if notification is saved in DB.

### 2.2 API Endpoint

- Method: POST
- URL: /users/save-token
- Auth: Recommended (JWT)
- Content-Type: application/json

Request body example:

```json
{
  "userId": "123",
  "token": "FCM_DEVICE_TOKEN_FROM_FLUTTER"
}
```

Recommended success response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "FCM token saved successfully",
  "data": {
    "userId": "123",
    "fcmToken": "FCM_DEVICE_TOKEN_FROM_FLUTTER",
    "savedAt": "2026-04-17T12:30:00.000Z"
  }
}
```

Recommended error responses:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "userId and token are required",
  "data": null
}
```

```json
{
  "statusCode": 404,
  "success": false,
  "message": "User not found",
  "data": null
}
```

### 2.3 Backend implementation notes

Current codebase already has user schema support for token storage via `fcmToken` field.

To make Save Token API live, backend should add:

1. Route in user routes file:

```ts
router.post(
  "/save-token",
  JwtInstance.authenticate(Object.values(ROLES)),
  UserController.saveToken
);
```

2. Controller method:

```ts
saveToken = this.catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.saveToken(req.body.userId, req.body.token);
  this.sendResponse(res, {
    statusCode: HttpStatusCode.OK,
    success: true,
    message: "FCM token saved successfully",
    data: result,
  });
});
```

3. Service method:

```ts
async saveToken(userId: string, token: string) {
  if (!userId || !token) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, "userId and token are required");
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { fcmToken: token.trim() },
    { new: true }
  );

  if (!user) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
  }

  return {
    userId: user._id.toString(),
    fcmToken: user.fcmToken,
    savedAt: new Date().toISOString(),
  };
}
```

## 3) Event to Notification Flow (Detailed)

1. Any module service runs a create or update operation.
2. Service publishes event with event type and payload.
3. EventBus broadcasts event.
4. Worker subscription enqueues event in JobQueue.
5. Queue executes event handler.
6. Notification handler reads user FCM token from user record.
7. Handler sends Firebase push when token exists.
8. Handler writes notification into notification collection.
9. Flutter receives push in real-time and also fetches notification history API.

## 4) Event Types Used

Create events:

- STUDY_PLAN_CREATED
- YOUTUBE_VIDEO_ADDED
- RESULT_PUBLISHED
- BOOK_UPLOADED
- EXAM_CREATED
- GUIDELINE_CREATED

Update events:

- STUDY_PLAN_UPDATED
- YOUTUBE_VIDEO_UPDATED
- RESULT_UPDATED
- BOOK_UPDATED
- EXAM_UPDATED
- GUIDELINE_UPDATED

Compatibility events (existing):

- SEND_NOTIFICATION
- EXAM_RESULT_PUBLISHED
- OTP_SENT

## 5) Event Payload Contract

Recommended payload for module create/update publish:

```json
{
  "userId": "string",
  "title": "string",
  "description": "Created successfully or Updated successfully",
  "module": "study-plan | youtube | result | books | exam | guideline",
  "time": "ISO date string"
}
```

Notes:

- userId should come from created_by, updated_by, authenticated user, or domain ownership logic.
- title should come from item title/name.
- time should be generated using new Date().toISOString().

## 6) Firebase Setup and Push Sending

### 6.1 Required files

- src/config/firebase/firebase.config.ts
- src/config/firebase/serviceAccountKey.json

### 6.2 Initialization behavior

- Uses singleton Firebase admin app.
- Prevents duplicate initializeApp calls.

### 6.3 Reusable push sender

`sendPushNotification(token, title, body)`

- Calls firebase admin messaging send API.
- Returns success with messageId on success.
- Returns failure object when send fails.
- Safe to reuse from any background handler.

### 6.4 Failure handling behavior

- If push fails, error is contained and system can continue to save notification in DB.
- This prevents notification loss in app inbox.

## 7) Notification APIs for Flutter

Base path: /api/v1/notifications

### 7.1 Get all notifications

- Method: GET
- URL: /api/v1/notifications?userId=123

### 7.2 Get unread notifications

- Method: GET
- URL: /api/v1/notifications/unread?userId=123

### 7.3 Mark as read

- Method: PATCH
- URL: /api/v1/notifications/:id/read

## 8) JSON Response Format for Flutter

Use this normalized object in Flutter state/store:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "time": "ISO date string",
  "module": "study-plan | youtube | result | books | exam | guideline",
  "isRead": false
}
```

Field mapping from backend notification document:

- id = \_id
- title = title
- description = description
- time = createdAt
- module = module
- isRead = isRead

## 9) Flutter Integration Guide

### 9.1 Save token at login/startup

```dart
final messaging = FirebaseMessaging.instance;
final token = await messaging.getToken();

if (token != null) {
  await http.post(
    Uri.parse('https://your-domain.com/api/v1/users/save-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'userId': userId,
      'token': token,
    }),
  );
}
```

### 9.2 Refresh token handling

```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
  await http.post(
    Uri.parse('https://your-domain.com/api/v1/users/save-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'userId': userId,
      'token': newToken,
    }),
  );
});
```

### 9.3 Receive foreground push

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final title = message.notification?.title ?? 'Notification';
  final body = message.notification?.body ?? '';
  // show local notification banner
});
```

### 9.4 Sync app inbox

- On app open, call notification list API.
- On pull-to-refresh, re-fetch unread endpoint.
- On notification open, call mark-as-read API.

## 10) Example Event Triggers by Module

Study plan create/update:

```ts
await eventBus.publish({
  type: "STUDY_PLAN_CREATED",
  payload: {
    userId,
    title: studyPlan.title,
    description: "Created successfully",
    module: "study-plan",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "STUDY_PLAN_UPDATED",
  payload: {
    userId,
    title: studyPlan.title,
    description: "Updated successfully",
    module: "study-plan",
    time: new Date().toISOString(),
  },
});
```

YouTube create/update:

```ts
await eventBus.publish({
  type: "YOUTUBE_VIDEO_ADDED",
  payload: {
    userId,
    title: video.title,
    description: "Created successfully",
    module: "youtube",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "YOUTUBE_VIDEO_UPDATED",
  payload: {
    userId,
    title: video.title,
    description: "Updated successfully",
    module: "youtube",
    time: new Date().toISOString(),
  },
});
```

Result create/update:

```ts
await eventBus.publish({
  type: "RESULT_PUBLISHED",
  payload: {
    userId,
    title: "Result Published",
    description: "Created successfully",
    module: "result",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "RESULT_UPDATED",
  payload: {
    userId,
    title: "Result Updated",
    description: "Updated successfully",
    module: "result",
    time: new Date().toISOString(),
  },
});
```

Books create/update:

```ts
await eventBus.publish({
  type: "BOOK_UPLOADED",
  payload: {
    userId,
    title: book.title,
    description: "Created successfully",
    module: "books",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "BOOK_UPDATED",
  payload: {
    userId,
    title: book.title,
    description: "Updated successfully",
    module: "books",
    time: new Date().toISOString(),
  },
});
```

Exam create/update:

```ts
await eventBus.publish({
  type: "EXAM_CREATED",
  payload: {
    userId,
    title: exam.title,
    description: "Created successfully",
    module: "exam",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "EXAM_UPDATED",
  payload: {
    userId,
    title: exam.title,
    description: "Updated successfully",
    module: "exam",
    time: new Date().toISOString(),
  },
});
```

Guideline create/update:

```ts
await eventBus.publish({
  type: "GUIDELINE_CREATED",
  payload: {
    userId,
    title: guideline.title,
    description: "Created successfully",
    module: "guideline",
    time: new Date().toISOString(),
  },
});
```

```ts
await eventBus.publish({
  type: "GUIDELINE_UPDATED",
  payload: {
    userId,
    title: guideline.title,
    description: "Updated successfully",
    module: "guideline",
    time: new Date().toISOString(),
  },
});
```

## 11) Debugging Checklist

If push is not received:

1. Check if user has non-empty `fcmToken` in DB.
2. Check Save Token API response from mobile app.
3. Verify Firebase service account file is valid and active.
4. Check worker is initialized during app startup.
5. Check event is published in create/update service.
6. Check worker switch has matching case for that event type.
7. Check notification record is saved in DB.
8. Check device/app notification permission settings.

If notification is in DB but no push:

- Usually token is missing/expired or Firebase delivery failed.
- Re-save token from device and retry.

## 12) Production Notes

- Keep push sending in worker, not inside request-response critical path.
- Always save DB notification even when push fails.
- Re-register token on every login and on token refresh.
- Consider adding retry with backoff for transient Firebase failures.
