export class ResponseDto<T> {
    error: any[];
    message: string;
    statusCode: number;
    data: T;
  
    constructor(data: T, message: string = 'success', statusCode: number = 200, error: string[] = []) {
      this.error = error;
      this.message = message;
      this.statusCode = statusCode;
      this.data = data;
    }
  }
  