export interface IExamParticipation {
  exam_number: number;
  exam_name: string;
  participants: number;
  participationRate: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
}

export interface IDashboardStats {
  totalExams: number;
  completedExams: number;
  totalStudents: number;
  totalQuestions: number;
  totalGuidelines: number;
  totalYoutubeVideos: number;
  rokomariBooks: number;
  totalResults: number;
  examParticipation: IExamParticipation[];
}
