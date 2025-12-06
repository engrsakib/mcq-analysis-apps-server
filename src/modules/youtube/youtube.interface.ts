export type IYoutube = {
  video_number?: number;
  title: string;
  video_url: string;
  description?: string;
  is_published: boolean;
};

export enum ADMIN_ENUMS {
  INACTIVE = "inactive",
  ACTIVE = "active",
  ADMIN_APPROVAL = "admin_approval",
}
