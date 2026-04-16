import { BarcodeService } from "@/lib/barcode";
import { BooksModel } from "./books.model";
import { eventBus } from "@/events/EventBus";

class Service {
  async create(bookData: any) {
    bookData.book_number = await BarcodeService.generateEAN13(); // Auto-increment book_number

    const book = await BooksModel.create(bookData);

    await eventBus.publish({
      type: "BOOK_UPLOADED",
      payload: {
        userId: bookData.created_by || "system",
        bookId: (book.book_number as any)?.toString() || book._id.toString(),
        title: book.title,
      },
    });

    return book;
  }

  async getAllBooks(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const books = await BooksModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await BooksModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: books,
    };
  }

  async getAllBooksForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      is_published: true,
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const books = await BooksModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await BooksModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: books,
    };
  }

  async getBookById(id: string) {
    const book = await BooksModel.findOne({ book_number: id });
    return book;
  }

  async updateBookById(id: string, updateData: any) {
    const updatedBook = await BooksModel.findOneAndUpdate(
      { book_number: id },
      updateData,
      { new: true }
    );

    if (updatedBook) {
      await eventBus.publish({
        type: "BOOK_UPDATED",
        payload: {
          userId: updateData.updated_by || "system",
          bookId:
            (updatedBook.book_number as any)?.toString() ||
            updatedBook._id.toString(),
          title: updatedBook.title,
        },
      });
    }

    return updatedBook;
  }

  async deleteBookById(id: string) {
    const deletedBook = await BooksModel.findOneAndDelete({
      book_number: id,
    });
    return deletedBook;
  }

  async publishBookToggole(id: string) {
    const publishedBook = await BooksModel.findOneAndUpdate(
      { book_number: id },
      [{ $set: { is_published: { $not: "$is_published" } } }],
      { new: true }
    );

    return publishedBook;
  }
}

export const BooksService = new Service();
