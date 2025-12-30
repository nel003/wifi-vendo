
export interface AdminUser {
  id: number;
  email: string,
  token: string;
  refreshToken?: string;
  name: string;
  username: string;
}

export interface User {
  id: number;
  ip: string;
  mac: string;
  device: string;
  expire_on: Date | null;
  timeout: number;
  paused: boolean;
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
  price: number;
  used: boolean;
  hidden: boolean;
}

export interface Clients {
  id: number;
  mac: string;
  expire_on: string;
  device: string;
  label: string;
  active: boolean;
}


export interface Transaction {
  id: number;
  amount: number;
  by: string;
}


export interface Dashboard {
  ramUsage: number
  cpuUsage: number
  storageUsage: number
  sales: number
  voucher_count: number
  used_count: number
  rate_count: number
  client_count: number
  c_earnings: number
  v_earnings: number
  ramText: string
  storageText: string
}