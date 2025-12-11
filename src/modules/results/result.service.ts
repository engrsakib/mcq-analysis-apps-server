import { ResultModel } from "./result.model";

class service {
  createResult = async (resultData: any) => {
    const result = await ResultModel.create(resultData);
    return result;
  };

  getResultsBySearch = async (
    phone?: string,
    examNum?: number,
    page: number = 1,
    limit: number = 10
  ) => {
    const skip = (page - 1) * limit;

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
        $facet: {
          // ক. ডাটা আনার পাইপলাইন
          data: [
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                student_name: 1,
                student_phone: 1,
                exam_number: 1,
                total_score: 1,
                score: 1,
              },
            },
          ],

          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const data = result[0].data;
    const totalResult = result[0].totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalResult / limit);

    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      data,
    };
  };
}

export const resultService = new service();
