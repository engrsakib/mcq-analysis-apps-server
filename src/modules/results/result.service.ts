import { ResultModel } from "./result.model";

class service {
  createResult = async (resultData: any) => {
    const result = await ResultModel.create(resultData);
    return result;
  };

  getResultsBySearch = async (phone?: string, examNum?: number) => {
    const matchQuery: any = {};

    if (phone) {
      matchQuery.student_phone = phone;
    }
    if (examNum) {
      matchQuery.exam_number = examNum;
    }

    const result = await ResultModel.aggregate([
      {
        $match: matchQuery,
      },

      {
        $sort: {
          score: -1,
        },
      },

      {
        $project: {
          _id: 0,
          student_name: 1,
          student_phone: 1,
          exam_number: 1,
          score: 1,
        },
      },
    ]);

    return result;
  };
}

export const resultService = new service();
