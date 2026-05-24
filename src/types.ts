/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Wallet {
  id: string;
  userId: string;
  phone: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  reference: string;
  senderPhone: string;
  receiverPhone: string;
  amount: number;
  currency: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'REVERTED';
  failReason?: string;
  timestamp: string;
  stepLogs: string[];
}

export interface WebhookConfig {
  url: string;
  secret: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  url: string;
  payload: any;
  status: 'SUCCESS' | 'FAILED';
  responseCode?: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  service: 'User Service' | 'Wallet Service' | 'Notification Service' | 'Payment Gateway' | 'Queue Broker';
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export interface RateLimitStatus {
  tokensRemaining: number;
  maxTokens: number;
  lastRequestTime: string;
}
