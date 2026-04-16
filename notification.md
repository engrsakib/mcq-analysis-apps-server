# Notification System Documentation

This document explains the Notification System architecture, event flow, Firebase push integration, REST APIs, and Flutter usage.

## 1) Architecture (ASCII Diagram)

```text
+-------------------+        publish(event)        +-------------------+
| Module Service    | ---------------------------> | EventBus          |
| (StudyPlan/etc.)  |                              | events/EventBus   |
+-------------------+                              +---------+---------+
                                                              |
                                                              | subscribe + enqueue
                                                              v
                                                   +----------+----------+
                                                   | JobQueue            |
                                                   | events/JobQueue     |
                                                   +----------+----------+
                                                              |
                                                              | setHandler(event)
                                                              v
                                                   +----------+----------+
                                                   | Worker Dispatcher   |
                                                   | events/Worker       |
                                                   +----+-----------+----+
                                                        |           |
                                   calls module handler |           | calls module handler
                                                        v           v
                                         +--------------+-----------+----------------+
                                         | notification.handler.ts                   |
                                         | - getUserFcmToken(userId)                |
                                         | - sendPushNotification(token,title,body) |
                                         | - NotificationService.createNotification  |
                                         +--------------+----------------------------+
                                                        |
                                 +----------------------+--------------------+
                                 |                                           |
                                 v                                           v
                     +-----------+-----------+                   +-----------+-----------+
                     | Firebase Admin (FCM)  |                   | MongoDB (Notification)|
                     | config/firebase       |                   | notification.model.ts  |
                     +-----------------------+                   +-----------------------+
```

## 2) Core Components

- Event type definitions: src/events/EventTypes.ts
- Event publish/subscribe: src/events/EventBus.ts
- In-memory queue and processor: src/events/JobQueue.ts
- Worker event dispatcher: src/events/Worker.ts
- Notification handlers: src/modules/notification/notification.handler.ts
- Notification persistence: src/modules/notification/notification.service.ts and src/modules/notification/notification.model.ts
- Firebase push sender: src/config/firebase/firebase.config.ts
- Notification REST API: src/modules/notification/notification.routes.ts and src/modules/notification/notification.controller.ts

## 3) Supported Notification Event Types

From src/events/EventTypes.ts:

- STUDY_PLAN_CREATED
- YOUTUBE_VIDEO_ADDED
- RESULT_PUBLISHED
- BOOK_UPLOADED
- EXAM_CREATED
- GUIDELINE_CREATED

Also currently supported for compatibility:

- SEND_NOTIFICATION
- EXAM_RESULT_PUBLISHED (mapped to result flow in Worker)
- OTP_SENT (ignored by notification pipeline)

## 4) Event Flow Explanation

1. A module (for example Study Plan service) calls:
   - eventBus.publish({ type, payload })
2. Worker is initialized in app startup via initWorker() in src/app.ts.
3. initWorker() subscribes EventBus and pushes every event into JobQueue.
4. JobQueue processes one event at a time and invokes Worker handler.
5. Worker switch routes by event.type to the correct notification handler.
6. Handler steps:
   - fetch user FCM token from UserModel (fcmToken)
   - call sendPushNotification(token, title, body) if token exists
   - save notification in DB via NotificationService.createNotification()

## 5) Worker Processing Details

Worker logic in src/events/Worker.ts:

- jobQueue.setHandler(async (event) => { switch(event.type) { ... } })
- Dispatches to:
  - handleStudyPlanCreated
  - handleYoutubeVideoAdded
  - handleResultPublished
  - handleBookUploaded
  - handleExamCreated
  - handleGuidelineCreated
- Compatibility mapping:
  - EXAM_RESULT_PUBLISHED -> handleResultPublished({ ... })
- initWorker() is idempotent (runs once) using workerInitialized flag.

## 6) Firebase Setup Guide

### Files

- Firebase config: src/config/firebase/firebase.config.ts
- Service account key: src/config/firebase/serviceAccountKey.json

### How initialization works

- Uses Firebase Admin SDK singleton:
  - If app already initialized, reuse admin.app()
  - Else initialize with service account certificate

### Reusable sender

sendPushNotification(token, title, body):

- Uses firebaseAdmin.messaging().send({ token, notification: { title, body } })
- Returns:
  - success true with messageId
  - success false with error message
- Safe try/catch for production stability

### Security notes

- Never commit exposed service keys in public repositories
- Restrict service account permissions to only what is needed
- Rotate keys when compromised

## 7) Notification REST API Documentation

Base route is mounted at:

- /api/v1/notifications

### 7.1 Get all notifications

- Method: GET
- URL: /api/v1/notifications?userId=USER_ID

Success response (controller wrapper):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "661f2c...",
      "title": "New exam available",
      "description": "Exam created: EX-101",
      "module": "exam",
      "userId": "65ff...",
      "isRead": false,
      "createdAt": "2026-04-17T08:30:00.000Z"
    }
  ]
}
```

### 7.2 Get unread notifications

- Method: GET
- URL: /api/v1/notifications/unread?userId=USER_ID

Success response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Unread notifications retrieved successfully",
  "data": [
    {
      "_id": "661f2c...",
      "title": "Study plan published",
      "description": "Study plan created: #1001",
      "module": "study-plan",
      "userId": "65ff...",
      "isRead": false,
      "createdAt": "2026-04-17T08:35:00.000Z"
    }
  ]
}
```

### 7.3 Mark notification as read

- Method: PATCH
- URL: /api/v1/notifications/:id/read

Success response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Notification marked as read successfully",
  "data": {
    "_id": "661f2c...",
    "title": "Study plan published",
    "description": "Study plan created: #1001",
    "module": "study-plan",
    "userId": "65ff...",
    "isRead": true,
    "createdAt": "2026-04-17T08:35:00.000Z"
  }
}
```

### 7.4 Error responses

Missing userId query:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "userId query parameter is required",
  "data": null
}
```

Not found on mark read:

```json
{
  "statusCode": 404,
  "success": false,
  "message": "Notification not found",
  "data": null
}
```

## 8) JSON Response Format for Flutter

Recommended normalized DTO in Flutter app:

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

Mapping from backend notification document:

- id <- \_id
- title <- title
- description <- description
- time <- createdAt
- module <- module
- isRead <- isRead

## 9) Example Flutter Usage

### 9.1 Model

```dart
class AppNotification {
  final String id;
  final String title;
  final String description;
  final DateTime time;
  final String module;
  final bool isRead;

  AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.time,
    required this.module,
    required this.isRead,
  });

  factory AppNotification.fromBackend(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      time: DateTime.parse(json['createdAt'] as String),
      module: json['module'] as String,
      isRead: json['isRead'] as bool,
    );
  }

  Map<String, dynamic> toFlutterJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'time': time.toIso8601String(),
      'module': module,
      'isRead': isRead,
    };
  }
}
```

### 9.2 Fetch notifications

```dart
final uri = Uri.parse(
  'https://your-domain.com/api/v1/notifications?userId=$userId',
);
final res = await http.get(uri);
final body = jsonDecode(res.body) as Map<String, dynamic>;
final list = (body['data'] as List)
    .map((e) => AppNotification.fromBackend(e as Map<String, dynamic>))
    .toList();
```

### 9.3 Mark as read

```dart
await http.patch(
  Uri.parse('https://your-domain.com/api/v1/notifications/$id/read'),
);
```

### 9.4 FCM foreground handling

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final title = message.notification?.title ?? 'Notification';
  final body = message.notification?.body ?? '';
  // Show local notification / in-app banner
});
```

## 10) Example Event Triggers

Use eventBus.publish(...) from each module service after successful create/publish actions.

### 10.1 Study Plan module trigger

```ts
await eventBus.publish({
  type: "STUDY_PLAN_CREATED",
  payload: {
    userId: targetUserId,
    planId: createdPlan.study_plan_number,
    title: createdPlan.title,
  },
});
```

### 10.2 YouTube module trigger

```ts
await eventBus.publish({
  type: "YOUTUBE_VIDEO_ADDED",
  payload: {
    userId: targetUserId,
    videoId: createdVideo.video_id,
    title: createdVideo.title,
  },
});
```

### 10.3 Result module trigger

```ts
await eventBus.publish({
  type: "RESULT_PUBLISHED",
  payload: {
    userId: targetUserId,
    resultId: result._id.toString(),
    title: "Result Published",
    score: result.score,
  },
});
```

### 10.4 Books module trigger

```ts
await eventBus.publish({
  type: "BOOK_UPLOADED",
  payload: {
    userId: targetUserId,
    bookId: createdBook.book_number.toString(),
    title: createdBook.title,
  },
});
```

### 10.5 Exam module trigger

```ts
await eventBus.publish({
  type: "EXAM_CREATED",
  payload: {
    userId: targetUserId,
    examId: createdExam.exam_number.toString(),
    title: createdExam.title,
  },
});
```

### 10.6 Guideline module trigger

```ts
await eventBus.publish({
  type: "GUIDELINE_CREATED",
  payload: {
    userId: targetUserId,
    guidelineId: createdGuideline.guideline_number.toString(),
    title: createdGuideline.title,
  },
});
```

## 11) How Firebase Push Is Sent

In notification.handler.ts:

1. getUserFcmToken(userId)
   - Fetches user record by id and reads fcmToken
2. processNotification(payload)
   - If token exists: sendPushNotification(token, payload.title, payload.description)
   - Always persists notification in DB via NotificationService.createNotification(payload)

This ensures:

- Push can fail without losing in-app notification history
- Notification center remains source of truth for Flutter UI

## 12) Quick Integration Checklist

- Ensure user document has valid fcmToken
- Ensure Firebase service account file is valid
- Ensure initWorker() runs on app startup
- Ensure each module publishes eventBus events after successful business action
- Use /api/v1/notifications endpoints in Flutter for list/unread/read state
