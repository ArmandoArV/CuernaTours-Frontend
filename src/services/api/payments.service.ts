import { ApiClient, ApiError } from "./ApiClient";

export interface DriverPaymentData {
    tripId: string;
    amount: number;
    cashReceived: boolean;
    cashAmount?: number;
}

class PaymentsService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient();
    }

    async payDriver(paymentData: DriverPaymentData): Promise<any> {
        try {
            // Submit driver receipt
            const receiptData = {
                contract_trip_id: Number(paymentData.tripId),
                payment_method: paymentData.cashReceived ? 'cash' : 'transfer',
                amount_received: paymentData.cashReceived ? (paymentData.cashAmount || 0) : 0,
                received_date: new Date().toISOString(),
                notes: `Driver payment amount: $${paymentData.amount}`,
            };
            
            const response = await this.apiClient.post(`/driver-receipts`, receiptData);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('An unexpected error occurred while processing driver payment.');
        }
    }
}

export const paymentsService = new PaymentsService();
