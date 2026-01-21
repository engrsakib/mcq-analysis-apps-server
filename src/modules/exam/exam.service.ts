import { BarcodeService } from "@/lib/barcode";
import { ExamModel } from "./exam.model";
import { IExam } from "./exam.interface";
import { ResultModel } from "../results/result.model";

class Service {
  async createExam(payload: Partial<IExam>): Promise<IExam> {
    try {
      const examNumber = BarcodeService.generateEAN13();

      const examData = {
        ...payload,
        exam_number: examNumber,
        is_published: false,
        is_started: false,
        is_completed: false,
      };

      const result = await ExamModel.create(examData);

      return result;
    } catch (error) {
      throw new Error(`Failed to create exam: ${error}`);
    }
  }

  async getAllExams(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const exams = await ExamModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .select("-questions")
      .sort({ createdAt: -1 });

    const total = await ExamModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: exams,
    };
  }

  async getAllExamsForUsers(query: any, userPhone: string) {
    // ১. userPhone প্যারামিটার যোগ করা হয়েছে
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      is_published: true,
      // is_started: true,
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    // ২. .lean() ব্যবহার করা হয়েছে যাতে আমরা ডাটা মডিফাই করতে পারি
    const exams = await ExamModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .select("-questions")
      .sort({ createdAt: -1 })
      .lean();

    const total = await ExamModel.countDocuments(searchCondition);

    // ৩. এক্সামগুলোর exam_number বের করা হলো
    const examNumbers = exams.map((exam) => exam.exam_number);

    // ৪. ResultModel থেকে চেক করা হচ্ছে ইউজার এই এক্সামগুলো দিয়েছে কি না
    const attendedExams = await ResultModel.find({
      student_phone: userPhone,
      exam_number: { $in: examNumbers },
    }).select("exam_number");

    // ৫. ফাস্ট লুকআপের জন্য Set তৈরি করা হলো
    const attendedExamNumbers = new Set(
      attendedExams.map((res) => res.exam_number)
    );

    // ৬. ডাটা ম্যাপ করে is_attends_exam ফিল্ডটি যুক্ত করা হলো
    const dataWithAttendanceStatus = exams.map((exam) => ({
      ...exam,
      is_attends_exam: attendedExamNumbers.has(exam.exam_number),
    }));

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: dataWithAttendanceStatus, // মডিফাইড ডাটা রিটার্ন করা হলো
    };
  }

  async getExamById(id: string) {
    const exam = await ExamModel.findOne({ exam_number: id }).populate(
      "questions"
    );
    return exam;
  }

  async getExamByIdForUsers(id: string) {
    const exam = await ExamModel.findOne({
      exam_number: id,
      is_started: true,
    }).populate("questions");
    return exam;
  }

  async updateExamById(id: string, payload: Partial<IExam>) {
    const updatedExam = await ExamModel.findOneAndUpdate(
      { exam_number: id },
      payload,
      {
        new: true,
        runValidators: true,
      }
    ).populate("questions");

    // যদি এক্সাম খুঁজে না পাওয়া যায়
    if (!updatedExam) {
      throw new Error("Exam not found");
    }

    return updatedExam;
  }

  async deleteExamById(id: string) {
    const deletedExam = await ExamModel.findOneAndDelete({
      exam_number: id,
    });
    return deletedExam;
  }

  async getExamForSearch(search?: string) {
    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");

      const orConditions: any[] = [{ exam_name: { $regex: searchRegex } }];

      // ২. যদি ইনপুটটি নাম্বার হয় (যেমন: 101), তবে exam_number দিয়েও খুঁজবে
      if (!isNaN(Number(search))) {
        orConditions.push({ exam_number: Number(search) });
      }

      query.$or = orConditions;
    }

    const exams = await ExamModel.find(query)
      .select("exam_number exam_name exam_date_time is_published, is_completed")
      .sort({ exam_date_time: -1 })
      .limit(15)
      .lean();

    return exams;
  }

  async updateExamStatus(id: string, payload: Partial<IExam>) {
    const updatedExam = await ExamModel.findOneAndUpdate(
      { exam_number: id },
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedExam) {
      throw new Error("Exam not found");
    }

    return updatedExam;
  }
}

export const examService = new Service();
