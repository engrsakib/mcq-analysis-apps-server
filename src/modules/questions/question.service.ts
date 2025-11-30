// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { QuestionModel } from "./questuon.model";
import { BarcodeService } from "@/lib/barcode";

class Service {
  createQuestion = async (questionData: any) => {
    const quesId = BarcodeService.generateEAN13();
    questionData.questionId = quesId;

    const question = await QuestionModel.create(questionData);
    return question;
  };
  // getAllQuestions = async (paginationOptions: IPaginationOptions) => {
  //   const { page, limit, skip, sortBy, sortOrder } =
  //     paginationHelpers.calculatePagination(paginationOptions);
  //   const sortConditions: { [key: string]: 1 | -1 } = {};

  //   if (sortBy && sortOrder) {
  //     sortConditions[sortBy] = sortOrder === "asc" ? 1 : -1;
  //   }
  //   const questions = await QuestionModel.find()
  //     .sort(sortConditions)
  //     .skip(skip)
  //     .limit(limit);
  //   const total = await QuestionModel.countDocuments();
  //   return { meta: { page, limit, total }, data: questions };
  // };

  // ১. এখানে searchTerm আর্গুমেন্ট হিসেবে রিসিভ করবেন (paginationOptions এর পাশাপাশি বা আলাদাভাবে)
  getAllQuestions = async (
    filters: { searchTerm?: string }, // নতুন ফিল্টার প্যারামিটার
    paginationOptions: IPaginationOptions
  ) => {
    const { searchTerm } = filters;
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(paginationOptions);

    // ২. সার্চ কন্ডিশন তৈরি করা
    const andConditions: any[] = [];

    // যদি searchTerm থাকে, তবে title এর ওপর partial match সার্চ করবে
    if (searchTerm) {
      andConditions.push({
        $or: [
          {
            title: {
              $regex: searchTerm,
              $options: "i", // 'i' মানে case-insensitive (ছোট/বড় হাতের অক্ষর সমস্যা করবে না)
            },
          },
        ],
      });
    }

    // ৩. ফাইনাল কুয়েরি কন্ডিশন
    // যদি কোনো কন্ডিশন থাকে তবে $and ব্যবহার করবে, না থাকলে খালি অবজেক্ট {}
    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    // ৪. সর্টিং কন্ডিশন
    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
      sortConditions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // ৫. ডাটাবেস কুয়েরি
    const questions = await QuestionModel.find(whereConditions) // এখানে whereConditions পাস করা হলো
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    // ৬. মোট ডকুমেন্ট গণনা (ফিল্টার অনুযায়ী)
    const total = await QuestionModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: questions,
    };
  };

  getQuestionById = async (id: number) => {
    const question = await QuestionModel.findOne({ questionId: id });
    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }
    return question;
  };

  updateQuestionById = async (id: number, updateData: Partial<any>) => {
    const question = await QuestionModel.findOneAndUpdate(
      { questionId: id },
      updateData,
      { new: true }
    );
    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }
    return question;
  };

  deleteQuestionById = async (id: number) => {
    const question = await QuestionModel.findOneAndDelete({ questionId: id });
    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }
    return question;
  };
}

export const QuestionService = new Service();
