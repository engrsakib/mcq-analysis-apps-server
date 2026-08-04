import { StudyTopicType } from "./question-study-topic.enum";

export interface IQuestionStudyTopic {
  category_number: number;
  name: string;
  type: StudyTopicType;
  position?: number;
}
