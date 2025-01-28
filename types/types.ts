export interface User {
    id: number;
    ip: string;
    mac: string;
    expire_on: Date;
}

export interface ErrorResponse {
    response: {
      data: {
        msg: string;
      };
    };
  }