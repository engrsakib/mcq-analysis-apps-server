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

  getResultsBySearchForUsers = async (
    loggedInUserPhone: string, // ১. লগইন ইউজারের ফোন নম্বর এখানে নিতে হবে
    phone?: string,
    examNum?: number,
    page: number = 1,
    limit: number = 10
  ) => {
    const skip = (page - 1) * limit;

    // ১. মেইন লিস্টের জন্য কুয়েরি (যা সার্চ বা ফিল্টার অনুযায়ী আসবে)
    const listMatchQuery: any = {};
    if (phone) listMatchQuery.student_phone = phone;
    if (examNum) listMatchQuery.exam_number = examNum;

    // ২. কারেন্ট ইউজারের জন্য কুয়েরি (লগইন ফোন নম্বর এবং নির্দিষ্ট এক্সাম নম্বর)
    const currentUserMatchQuery: any = {
      student_phone: loggedInUserPhone,
    };
    if (examNum) currentUserMatchQuery.exam_number = examNum;

    // ৩. কমন প্রোজেকশন (কি কি ফিল্ড দেখাবেন)
    const projectFields = {
      _id: 0,
      student_name: 1,
      student_phone: 1,
      exam_number: 1,
      total_score: 1,
      score: 1,
    };

    const result = await ResultModel.aggregate([
      {
        $facet: {
          // ক. মেইন ডাটা লিস্ট (লিডারবোর্ড বা রেজাল্ট লিস্ট)
          data: [
            { $match: listMatchQuery },
            { $sort: { score: -1 } }, // স্কোরের ভিত্তিতে সর্ট
            { $skip: skip },
            { $limit: limit },
            { $project: projectFields },
          ],

          // খ. মোট ডাটা কাউন্ট (পেজিনেশনের জন্য)
          totalCount: [{ $match: listMatchQuery }, { $count: "total" }],

          // গ. লগইন করা ইউজারের নিজের রেজাল্ট
          currentUser: [
            { $match: currentUserMatchQuery },
            { $project: projectFields },
            { $limit: 1 }, // একজন ইউজারের একটি এক্সামের একটাই রেজাল্ট দরকার
          ],
        },
      },
    ]);

    const data = result[0].data;
    const totalResult = result[0].totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalResult / limit);

    // কারেন্ট ইউজার ডাটা অ্যারে থেকে অবজেক্টে নেওয়া হলো (না থাকলে null)
    const currentUserData = result[0].currentUser[0] || null;

    // ৪. রেসপন্স রিটার্ন করা
    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      current_user: currentUserData, // এখানে লগইন ইউজারের ডাটা থাকবে
      data, // বাকি সবার ডাটা
    };
  };

  getSingleResultByExamNumber = async (
    examNum: number,
    student_phone?: string
  ) => {
    const result = await ResultModel.findOne({
      exam_number: examNum,
      student_phone,
    }).select("-dateTaken -createdAt -updatedAt -__v");

    if (!result) {
      throw new Error("Result not found for this exam number!");
    }

    return result;
  };

  updateStudentMarks = async (payload: IUpdateMarkPayload) => {
    const { exam_number, student_phone, amount, action } = payload;

    // লজিক: ইনক্রিজ বা ডিক্রিজ
    const incrementValue = action === "increase_marks" ? amount : -amount;

    // কুয়েরি: এখানে দুটো কন্ডিশনই সত্য হতে হবে (AND Logic)
    const result = await ResultModel.findOneAndUpdate(
      {
        exam_number: exam_number,
        student_phone: student_phone,
      },
      {
        $inc: { score: incrementValue },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // যদি রেজাল্ট না পাওয়া যায় (মানে রোল বা ফোন যেকোনো একটা ভুল বা ম্যাচ করেনি)
    if (!result) {
      throw new Error("Result not found! Exam number or Phone did not match.");
    }

    return result;
  };

  getExamLeaderboard = async (
    loggedInUserPhone: string, // ১. লগইন ইউজারের ফোন নম্বর
    examNum: number,
    query: any
  ) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // ২. প্রথমে ওই এক্সামের সবার রেজাল্ট নিয়ে আসা হলো (সর্টিং সহ)
    const allResults = await ResultModel.find({ exam_number: examNum })
      .sort({
        is_cheated: 1, // False (0) আগে, True (1) পরে -> অর্থাৎ সৎ আগে, চিটার শেষে
        is_on_time: -1, // True (1) আগে, False (0) পরে -> অর্থাৎ অন-টাইম আগে
        score: -1, // বেশি মার্ক আগে
        dateTaken: 1, // আগে জমা দেওয়া আগে
      })
      .select(
        "student_name student_phone score exam_number dateTaken is_cheated is_on_time"
      )
      .lean();

    // ৩. র‍্যাংক প্রসেসিং (লজিক বসানো)
    let currentRank = 1;

    const processedLeaderboard = allResults.map((student) => {
      let rankDisplay: string | number | null = null;

      if (student.is_cheated) {
        // যারা চিটেড করেছে
        rankDisplay = "Cheater";
      } else if (!student.is_on_time) {
        // যারা লেট করেছে (র‍্যাংক দিবে না)
        rankDisplay = null;
      } else {
        // যারা সৎ এবং অন-টাইম (র‍্যাংক পাবে)
        rankDisplay = currentRank++;
      }

      return {
        rank: rankDisplay,
        student_name: student.student_name,
        student_phone: student.student_phone,
        exam_number: student.exam_number,
        score: student.score,
        // date: student.dateTaken, // প্রয়োজন হলে আনকমেন্ট করো
      };
    });

    // ৪. লগইন করা ইউজারের ডাটা খুঁজে বের করা (প্রসেসড লিস্ট থেকে)
    const currentUserData =
      processedLeaderboard.find(
        (item) => item.student_phone === loggedInUserPhone
      ) || null;

    // ৫. পেজিনেশন লজিক (Array Slice)
    const totalResult = processedLeaderboard.length;
    const totalPages = Math.ceil(totalResult / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = processedLeaderboard.slice(
      startIndex,
      startIndex + limit
    );

    // ৬. ফাইনাল রেসপন্স রিটার্ন
    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      current_user: currentUserData, // লগইন ইউজারের নিজের রেজাল্ট ও র‍্যাংক
      data: paginatedData, // পেজিনেটেড লিডারবোর্ড
    };
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
