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

  getMixedLeaderboard = async (examNum: number, phone?: string) => {
    // শুধুমাত্র এক্সাম নাম্বার দিয়ে সব ডাটা আনা হচ্ছে (র‍্যাংক জেনারেশনের জন্য)
    const results = await ResultModel.find({ exam_number: examNum })
      .sort({
        is_cheated: 1, // সৎ আগে
        is_on_time: -1, // অন-টাইম আগে
        score: -1, // বেশি মার্ক আগে
        dateTaken: 1, // আগে জমা দেওয়া আগে
      })
      .select(
        "student_name student_phone score is_cheated is_on_time exam_number"
      )
      .lean();

    // ৩. সবার র‍্যাংক জেনারেট করা
    let currentRank = 1;

    const fullLeaderboard = results.map((student) => {
      let rankDisplay: string | number;

      if (student.is_cheated) {
        rankDisplay = "Cheater";
      } else {
        rankDisplay = currentRank++;
      }

      return {
        rank: rankDisplay,
        name: student.student_name,
        phone: student.student_phone, // ফোন নম্বর রেসপন্সে রাখা হলো ম্যাচ করার জন্য
        score: student.score,
        status: getStatusText(student.is_cheated, student.is_on_time),
        exam_number: student.exam_number,
      };
    });

    // ৪. যদি ফোন নম্বর দেওয়া থাকে, তাহলে ফিল্টার করে শুধু ওই ছাত্রকে পাঠাব
    if (phone) {
      const studentResult = fullLeaderboard.filter(
        (item) => item.phone === phone
      );
      return studentResult;
    }

    // ফোন নম্বর না থাকলে পুরো লিডারবোর্ড যাবে
    return fullLeaderboard;
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
