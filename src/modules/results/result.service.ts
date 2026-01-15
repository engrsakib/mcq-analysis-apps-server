import { IUpdateMarkPayload } from "./result.interface";
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

  getSingleResultByExamNumber = async (examNum: number) => {
    const result = await ResultModel.findOne({ exam_number: examNum }).select(
      "-dateTaken -createdAt -updatedAt -__v"
    );

    if (!result) {
      throw new Error("Result not found for this exam number!");
    }

    return result;
  };

  updateStudentMarks = async (payload: IUpdateMarkPayload) => {
    const { exam_number, amount, action } = payload;

    const incrementValue = action === "increase_marks" ? amount : -amount;

    const result = await ResultModel.findOneAndUpdate(
      { exam_number: exam_number },
      {
        $inc: { score: incrementValue },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      throw new Error("Student result not found!");
    }

    return result;
  };

  getExamLeaderboard = async (examNum?: number) => {
    const query: any = {
      is_cheated: false,
      is_on_time: true,
    };

    if (examNum) {
      query.exam_number = examNum;
    }

    const result = await ResultModel.find(query)

      .sort({ score: -1, dateTaken: 1 })

      .select("student_name score exam_number dateTaken")
      .lean();

    const leaderboard = result.map((student, index) => ({
      rank: index + 1,
      name: student.student_name,
      exam_number: student.exam_number,
      score: student.score,
      date: student.dateTaken,
    }));

    return leaderboard;
  };

  getResultLeaderboard = async (examNum?: number) => {
    const query: any = {};

    if (examNum) {
      query.exam_number = examNum;
    }

    const results = await ResultModel.find(query)
      .sort({
        is_cheated: 1,

        is_on_time: -1,

        score: -1,

        dateTaken: 1,
      })
      .select("student_name score is_cheated is_on_time exam_number")
      .lean();

    let currentRank = 1;

    const leaderboard = results.map((student) => {
      let rankDisplay: string | number;

      if (student.is_cheated) {
        rankDisplay = "Cheater";
      } else {
        rankDisplay = currentRank++;
      }

      return {
        rank: rankDisplay,
        name: student.student_name,
        score: student.score,
        status: getStatusText(student.is_cheated, student.is_on_time),
        exam_number: student.exam_number,
      };
    });

    return leaderboard;
  };

  // ছোট হেল্পার ফাংশন স্ট্যাটাস দেখানোর জন্য
}

const getStatusText = (isCheated: boolean, isOnTime: boolean): string => {
  if (isCheated) {
    return "Cheater";
  }
  if (isOnTime) {
    return "On Time";
  }
  return "Late Submission";
};

export const resultService = new service();
