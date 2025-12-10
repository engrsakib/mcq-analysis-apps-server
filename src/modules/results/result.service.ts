import { ResultModel } from "./result.model";

class service {
  createResult = async (resultData: any) => {
    const result = await ResultModel.create(resultData);
    return result;
  };
}

export const resultService = new service();
