// Shared types and utilities for Alpha Signal monorepo

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string; // 'NSE' | 'BSE'
  sector?: string;
  marketCap?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
