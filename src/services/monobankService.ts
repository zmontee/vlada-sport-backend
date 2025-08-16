import axios from 'axios';
import crypto from 'crypto';
import createHttpError from 'http-errors';

interface CreateInvoiceRequest {
  amount: number; // в копійках
  ccy?: number; // валюта, за замовчуванням 980 (гривня)
  merchantPaymInfo?: {
    reference: string;
    destination: string;
    comment?: string;
    basketOrder?: Array<{
      name: string;
      qty: number;
      sum: number;
      total: number;
      unit?: string;
      code?: string;
    }>;
  };
  redirectUrl: string;
  webHookUrl: string;
  validity?: number; // в секундах
  paymentType?: 'debit' | 'hold';
}

interface CreateInvoiceResponse {
  invoiceId: string;
  pageUrl: string;
}

interface WebhookPayload {
  invoiceId: string;
  status:
    | 'created'
    | 'processing'
    | 'hold'
    | 'success'
    | 'failure'
    | 'reversed'
    | 'expired';
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  paymentId?: string;
  failureReason?: string;
  cancelList?: Array<{
    status: string;
    amount: number;
    ccy: number;
    createdDate: string;
    modifiedDate: string;
    approvalCode?: string;
    rrn?: string;
    extRef?: string;
  }>;
}

// Кешуємо публічний ключ, щоб не запитувати його кожен раз
let cachedPublicKey: string | null = null;
let publicKeyLastFetch: number = 0;
const PUBLIC_KEY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 години

const monobankService = {
  createInvoice: async (
    params: CreateInvoiceRequest
  ): Promise<CreateInvoiceResponse> => {
    try {
      const response = await axios.post(
        'https://api.monobank.ua/api/merchant/invoice/create',
        params,
        {
          headers: {
            'X-Token': process.env.MONOBANK_TOKEN,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Monobank API Error:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.errorDescription || 'Payment service error';
        throw createHttpError(status, message);
      }

      throw createHttpError(500, 'Failed to create invoice');
    }
  },

  getInvoiceStatus: async (invoiceId: string) => {
    try {
      const response = await axios.get(
        `https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${invoiceId}`,
        {
          headers: {
            'X-Token': process.env.MONOBANK_TOKEN,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Monobank Status API Error:', error);
      throw createHttpError(500, 'Failed to get invoice status');
    }
  },

  getPublicKey: async (): Promise<string> => {
    const now = Date.now();

    // Використовуємо кешований ключ, якщо він ще актуальний
    if (
      cachedPublicKey &&
      now - publicKeyLastFetch < PUBLIC_KEY_CACHE_DURATION
    ) {
      return cachedPublicKey;
    }

    try {
      const response = await axios.get<{ key: string }>(
        'https://api.monobank.ua/api/merchant/pubkey',
        {
          headers: {
            'X-Token': process.env.MONOBANK_TOKEN,
          },
        }
      );

      cachedPublicKey = response.data.key;
      publicKeyLastFetch = now;

      return cachedPublicKey;
    } catch (error) {
      console.error('Failed to get Monobank public key:', error);
      throw createHttpError(
        500,
        'Failed to get public key for signature verification'
      );
    }
  },

  verifyWebhookSignature: async (
    webhookBody: string,
    signatureBase64: string
  ): Promise<boolean> => {
    try {
      // Отримати публічний ключ
      const pubKeyBase64 = await this.getPublicKey();

      // Конвертувати підпис та публічний ключ з Base64
      const signatureBuf = Buffer.from(signatureBase64, 'base64');
      const publicKeyBuf = Buffer.from(pubKeyBase64, 'base64');

      // Створити верифікатор
      const verify = crypto.createVerify('SHA256');
      verify.write(webhookBody);
      verify.end();

      // Верифікувати підпис
      const result = verify.verify(publicKeyBuf, signatureBuf);

      return result;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  },
};

export default monobankService;
export type { WebhookPayload };
