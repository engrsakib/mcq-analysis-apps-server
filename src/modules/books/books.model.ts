import { model, Schema } from "mongoose";
import { BOOK_PLATFORM_ENUMS, IBook } from "./books.interface";

const booksSchema = new Schema<IBook>({
  book_number: { type: Number, required: false },
  title: { type: String, required: true },
  thumbnail_url: { type: String, required: true },
  description: { type: String, required: false },
  is_published: { type: Boolean, required: true, default: false },
  price: { type: Number, required: true },
  sold_platform: {
    type: String,
    enum: Object.values(BOOK_PLATFORM_ENUMS),
    default: BOOK_PLATFORM_ENUMS.ROKOMARI,
    required: true,
  },
  buy_url: { type: String, required: true },
});

export const BooksModel = model("Books", booksSchema);
