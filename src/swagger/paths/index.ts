import { adminPaths } from "./admin.paths";
import { userPaths } from "./user.paths";
import {
  otpPaths,
  forgetPasswordPaths,
  uploadPaths,
  permissionPaths,
} from "./auth.paths";
import { questionPaths } from "./question.paths";
import { examPaths, resultPaths } from "./exam-result.paths";
import {
  booksPaths,
  guidelinePaths,
  youtubePaths,
  studyPlanPaths,
  examRoutinePaths,
  notificationPaths,
} from "./content.paths";
import { searchPaths } from "./search.paths";

export const apiPaths = {
  ...adminPaths,
  ...userPaths,
  ...otpPaths,
  ...forgetPasswordPaths,
  ...uploadPaths,
  ...permissionPaths,
  ...questionPaths,
  ...examPaths,
  ...resultPaths,
  ...booksPaths,
  ...guidelinePaths,
  ...youtubePaths,
  ...studyPlanPaths,
  ...examRoutinePaths,
  ...notificationPaths,
  ...searchPaths,
};
