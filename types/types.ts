export interface User {
    id: number;
    ip: string;
    mac: string;
    expire_on: Date | null;
}

export interface ErrorResponse {
    response: {
      data: {
        msg: string;
      };
    };
  }

export interface Rate {
    id: number;
    name: string;
    time: number;
    price: number;
}

export interface Voucher {
    id: number;
    voucher: string;
    time: number;
    used: boolean;
}