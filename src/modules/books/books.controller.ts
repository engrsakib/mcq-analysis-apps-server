import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookieManager } from "@/shared/cookie";
import { BooksService } from "./books.service";

class Controller extends BaseController {
  createBooks = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for creating a YouTube entry
    const bookData = req.body;
    if (!bookData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Book data is required",
      });
    }
    const createdBook = await BooksService.create(bookData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Book entry created successfully",
      data: createdBook,
    });
  });

  getAllBooks = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for retrieving all YouTube entries
    const query = req.query;
    const books = await BooksService.getAllBooks(query);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Book entries retrieved successfully",
      data: books,
    });
  });

  getBookById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    const book = await BooksService.getBookById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Book entry retrieved successfully",
      data: book, // Replace with actual data
    });
  });

  publishBookToggole = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Book entry ID is required",
      });
    }
    const publishedBook = await BooksService.publishBookToggole(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Book entry publish status toggled successfully",
      data: publishedBook,
    });
  });

  updateBookById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;

    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID and update data are required",
      });
    }

    const updatedBook = await BooksService.updateBookById(id, updateData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Book entry updated successfully",
      data: updatedBook,
    });
  });

  deleteBookById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    await BooksService.deleteBookById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Book entry deleted successfully",
    });
  });
}

export const BooksController = new Controller();
