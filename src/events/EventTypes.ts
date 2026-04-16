export type AppEvent =
  | {
      type: "SEND_NOTIFICATION";
      payload: { userId: string; title: string; message: string };
    }
  | {
      type: "STUDY_PLAN_CREATED";
      payload: { userId: string; planId: number | string; title: string };
    }
  | {
      type: "STUDY_PLAN_UPDATED";
      payload: { userId: string; planId: number | string; title: string };
    }
  | {
      type: "YOUTUBE_VIDEO_ADDED";
      payload: { userId: string; videoId: string; title: string };
    }
  | {
      type: "YOUTUBE_VIDEO_UPDATED";
      payload: { userId: string; videoId: string; title: string };
    }
  | {
      type: "RESULT_PUBLISHED";
      payload: {
        userId: string;
        resultId: string;
        title: string;
        score?: number;
      };
    }
  | {
      type: "RESULT_UPDATED";
      payload: {
        userId: string;
        resultId: string;
        title: string;
        score?: number;
      };
    }
  | {
      type: "BOOK_UPLOADED";
      payload: { userId: string; bookId: string; title: string };
    }
  | {
      type: "BOOK_UPDATED";
      payload: { userId: string; bookId: string; title: string };
    }
  | {
      type: "EXAM_CREATED";
      payload: { userId: string; examId: string; title: string };
    }
  | {
      type: "EXAM_UPDATED";
      payload: { userId: string; examId: string; title: string };
    }
  | {
      type: "GUIDELINE_CREATED";
      payload: { userId: string; guidelineId: string; title: string };
    }
  | {
      type: "GUIDELINE_UPDATED";
      payload: { userId: string; guidelineId: string; title: string };
    }
  | {
      type: "EXAM_RESULT_PUBLISHED";
      payload: { userId: string; examId: string; score: number };
    }
  | {
      type: "OTP_SENT";
      payload: { phone: string; otp: string };
    };
