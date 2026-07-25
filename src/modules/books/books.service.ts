import { BarcodeService } from "@/lib/barcode";
import { BooksModel } from "./books.model";
import { eventBus } from "@/events/EventBus";
import { searchHelpers } from "@/utils/searchHelpers";
import { AnyBulkWriteOperation, Types } from "mongoose";

type ReorderBookItem = {
  id?: string | number;
  _id?: string;
  book_number?: string | number;
  position: number;
};

class Service {
  async create(bookData: any) {
    bookData.book_number = await BarcodeService.generateEAN13();

    if (bookData.position === undefined || bookData.position === null) {
      const lastBook = await BooksModel.findOne()
        .sort({ position: -1 })
        .select("position");

      bookData.position = (lastBook?.position || 0) + 1;
    }

    const book = await BooksModel.create(bookData);

    await eventBus.publish({
      type: "BOOK_UPLOADED",
      payload: {
        userId: bookData.created_by || "system",
        title: book.title || "Book",
        description: "Created successfully",
        module: "books",
        time: new Date().toISOString(),
        bookId: (book.book_number as any)?.toString() || book._id.toString(),
      },
    });

    return book;
  }

  async getAllBooks(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition: Record<string, unknown> = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    if (query.sold_platform) {
      searchCondition.sold_platform = query.sold_platform;
    }

    const books = await BooksModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

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
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const books = await BooksModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

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
          title: updatedBook.title || "Book",
          description: "Updated successfully",
          module: "books",
          time: new Date().toISOString(),
          bookId:
            (updatedBook.book_number as any)?.toString() ||
            updatedBook._id.toString(),
        },
      });
    }

    return updatedBook;
  }

  async reorderBooks(items: ReorderBookItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.book_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { book_number: Number(identifier) };

        if ("book_number" in filter && !Number.isFinite(filter.book_number)) {
          return acc;
        }

        acc.push({
          updateOne: {
            filter,
            update: { $set: { position } },
          },
        });

        return acc;
      },
      []
    );

    if (!operations.length) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    return BooksModel.bulkWrite(operations);
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
