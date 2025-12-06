export type IBook = {
  book_number?: number;
  title: string;
  thumbnail_url: string;
  description?: string;
  is_published: boolean;
  price: number;
  sold_platform: BOOK_PLATFORM_ENUMS;
  buy_url: string;
};

export enum BOOK_PLATFORM_ENUMS {
  ROKOMARI = "rokomari",
  WAFI_LIFE = "wafi_life",
  OTHERS = "others",
}
