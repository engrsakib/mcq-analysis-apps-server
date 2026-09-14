import { BarcodeService } from "@/lib/barcode";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BooksModel } from "./books.model";
import { BOOK_PLATFORM_ENUMS } from "./books.interface";
import { eventBus } from "@/events/EventBus";
import { searchHelpers } from "@/utils/searchHelpers";
import { AnyBulkWriteOperation, Types } from "mongoose";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

type ReorderBookItem = {
  id?: string | number;
  _id?: string;
  book_number?: string | number;
  position: number;
};

const BOOK_UPDATABLE_FIELDS = [
  "title",
  "thumbnail_url",
  "description",
  "price",
  "sold_platform",
  "buy_url",
  "is_published",
  "position",
] as const;

type BookUpdatableField = (typeof BOOK_UPDATABLE_FIELDS)[number];

const VALID_SOLD_PLATFORMS = new Set<string>(
  Object.values(BOOK_PLATFORM_ENUMS)
);

const buildBookFilter = (id: string): Record<string, unknown> => {
  const trimmedId = String(id ?? "").trim();

  if (/^[0-9a-fA-F]{24}$/.test(trimmedId)) {
    return { _id: new Types.ObjectId(trimmedId) };
  }

  const bookNumber = Number(trimmedId);
  if (!trimmedId || !Number.isFinite(bookNumber)) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid book identifier");
  }

  return { book_number: bookNumber };
};

const sanitizeBookUpdate = (
  updateData: Record<string, unknown> | null | undefined
): Record<string, unknown> => {
  if (
    !updateData ||
    typeof updateData !== "object" ||
    Array.isArray(updateData)
  ) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      "Book update data is required"
    );
  }

  const sanitized: Record<string, unknown> = {};

  for (const field of BOOK_UPDATABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(updateData, field)) {
      continue;
    }

    const value = updateData[field];

    if (field === "sold_platform") {
      if (typeof value !== "string" || !VALID_SOLD_PLATFORMS.has(value)) {
        continue;
      }
      sanitized[field] = value;
      continue;
    }

    if (field === "thumbnail_url" && typeof value === "string") {
      sanitized[field] = value.trim();
      continue;
    }

    if (value !== undefined) {
      sanitized[field as BookUpdatableField] = value;
    }
  }

  if (!Object.keys(sanitized).length) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      "No updatable book fields were provided"
    );
  }

  return sanitized;
};

class Service {
  async create(bookData: any, actor?: ActorInfo) {
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
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "books",
        entityLabel: `"${book.title || "Book"}"`,
        entityId: String(book.book_number),
        module: "books",
      }),
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
    const book = await BooksModel.findOne(buildBookFilter(id));
    return book;
  }

  async updateBookById(id: string, updateData: any, actor?: ActorInfo) {
    const sanitized = sanitizeBookUpdate(updateData);

    const updatedBook = await BooksModel.findOneAndUpdate(
      buildBookFilter(id),
      { $set: sanitized },
      { new: true, runValidators: true }
    );

    if (updatedBook) {
      await eventBus.publish({
        type: "BOOK_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "books",
          entityLabel: `"${updatedBook.title || "Book"}"`,
          entityId: String(updatedBook.book_number),
          module: "books",
        }),
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
    const deletedBook = await BooksModel.findOneAndDelete(buildBookFilter(id));
    return deletedBook;
  }

  async publishBookToggole(id: string) {
    const publishedBook = await BooksModel.findOneAndUpdate(
      buildBookFilter(id),
      [{ $set: { is_published: { $not: "$is_published" } } }],
      { new: true }
    );

    return publishedBook;
  }
}

export const BooksService = new Service();
