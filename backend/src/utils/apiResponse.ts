export interface IApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

export class ApiResponse {
  static success(message: string, data?: any): IApiResponse {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errors?: any): IApiResponse {
    return {
      success: false,
      message,
      errors,
    };
  }
}
