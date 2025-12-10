import { ResultModel } from "./result.model";

class service {
  create = async (resultData: any) => {
    const result = await ResultModel.create(resultData);
    return result;
  };
}

export const resultService = new service();
