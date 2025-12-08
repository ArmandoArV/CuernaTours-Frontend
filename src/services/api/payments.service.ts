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
            const response = await this.apiClient.post('/payments/driver', paymentData);
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
