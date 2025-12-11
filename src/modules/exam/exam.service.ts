import { BarcodeService } from "@/lib/barcode";
import { ExamModel } from "./exam.model";
import { IExam } from "./exam.interface";

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

  async getExamById(id: string) {
    const exam = await ExamModel.findOne({ exam_number: id }).populate(
      "questions"
    );
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
      // ১. 'i' ফ্ল্যাগ থাকায় ছোট/বড় হাতের অক্ষর নিয়ে চিন্তা করতে হবে না
      // 'bsc' লিখলেও 'BSC' আসবে, 'math' লিখলেও 'BSC math test' আসবে
      const searchRegex = new RegExp(search, "i");

      const orConditions: any[] = [{ exam_name: { $regex: searchRegex } }];

      // ২. যদি ইনপুটটি নাম্বার হয় (যেমন: 101), তবে exam_number দিয়েও খুঁজবে
      if (!isNaN(Number(search))) {
        orConditions.push({ exam_number: Number(search) });
      }

      query.$or = orConditions;
    }

    const exams = await ExamModel.find(query)
      .select("exam_number exam_name exam_date_time")
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
