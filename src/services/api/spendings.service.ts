/**
 * Spendings Service
 *
 * Handles spending-related API calls
 */

import { apiClient } from './ApiClient';
import { apiConfig, API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';

export interface Spending {
  spending_id: number;
  spending_type?: string;
  spending_amount: number;
  driver_id: number;
  contract_id?: number;
  vehicle_id?: number;
  submitted_at: Date;
  approved_status: 'approved' | 'pending' | 'denied';
  approved_by_id?: number;
  payment_status: 'pending' | 'paid';
  comments?: string;
}

export interface SpendingAttachedFile {
  file_id: number;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: Date;
}

export interface SpendingWithFiles extends Spending {
  files: SpendingAttachedFile[];
}

export interface CreateSpendingRequest {
  spending_type?: string;
  spending_amount: number;
  driver_id: number;
  contract_id?: number;
  vehicle_id?: number;
  comments?: string;
}

export interface UpdateSpendingRequest {
  spending_type?: string;
  spending_amount?: number;
  comments?: string;
}

/** @deprecated use SpendingAttachedFile */
export interface SpendingFile {
  file_id: number;
  spending_id: number;
  file_url: string;
  original_name: string;
}

class SpendingsService {
  /**
   * Get all spendings
   */
  async getAll(): Promise<Spending[]> {
    const response = await apiClient.get<Spending[]>(API_ENDPOINTS.SPENDINGS.BASE);
    return validateResponse<Spending[]>(response);
  }

  /**
   * Get all spendings for a specific driver
   */
  async getByDriver(driverId: number): Promise<Spending[]> {
    const endpoint = API_ENDPOINTS.SPENDINGS.BY_DRIVER(driverId);
    const response = await apiClient.get<Spending[]>(endpoint);
    return validateResponse<Spending[]>(response);
  }

  /**
   * Get spending by ID
   */
  async getById(spendingId: number): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.BY_ID(spendingId);
    const response = await apiClient.get<Spending>(endpoint);
    return validateResponse<Spending>(response);
  }

  /**
   * Create new spending
   */
  async create(data: CreateSpendingRequest): Promise<Spending> {
    const response = await apiClient.post<Spending>(
      API_ENDPOINTS.SPENDINGS.BASE,
      data
    );
    return validateResponse<Spending>(response);
  }

  /**
   * Update existing spending
   */
  async update(spendingId: number, data: UpdateSpendingRequest): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.BY_ID(spendingId);
    const response = await apiClient.put<Spending>(endpoint, data);
    return validateResponse<Spending>(response);
  }

  /**
   * Get spending by ID with associated files
   */
  async getWithFiles(spendingId: number): Promise<SpendingWithFiles> {
    const endpoint = API_ENDPOINTS.SPENDINGS.FILES(spendingId);
    const response = await apiClient.get<SpendingWithFiles>(endpoint);
    return validateResponse<SpendingWithFiles>(response);
  }

  /**
   * Attach a file to an existing spending via the files upload endpoint
   */
  async addFile(spendingId: number, file: File): Promise<SpendingAttachedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'receipts');
    formData.append('entity_type', 'spending');
    formData.append('entity_id', spendingId.toString());

    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1];

    const response = await fetch(
      `${apiConfig.baseUrl}${API_ENDPOINTS.FILES.UPLOAD}`,
      {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, file: FileWithAssociations }
    const fileData = result?.file ?? result?.data;
    if (!fileData) throw new Error('Upload response missing file data');
    return fileData as SpendingAttachedFile;
  }

  /**
   * Get spending files
   * @deprecated Use getWithFiles() instead
   */
  async getFiles(spendingId: number): Promise<SpendingFile[]> {
    const data = await this.getWithFiles(spendingId);
    return (data.files ?? []).map((f) => ({
      file_id: f.file_id,
      spending_id: spendingId,
      file_url: `${apiConfig.baseUrl}${API_ENDPOINTS.FILES.DOWNLOAD(f.file_id)}`,
      original_name: f.original_name,
    }));
  }

  /**
   * Approve a spending
   */
  async approve(spendingId: number, approvedById: number, comments?: string): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.APPROVE(spendingId);
    const response = await apiClient.post<Spending>(endpoint, { approved_by_id: approvedById, comments });
    return validateResponse<Spending>(response);
  }

  /**
   * Deny a spending
   */
  async deny(spendingId: number, approvedById: number, comments?: string): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.DENY(spendingId);
    const response = await apiClient.post<Spending>(endpoint, { approved_by_id: approvedById, comments });
    return validateResponse<Spending>(response);
  }

  /**
   * Submit spending with files in a single multipart request.
   * Calls POST /spendings/submit
   */
  async submit(data: CreateSpendingRequest, files: File[]): Promise<SpendingWithFiles> {
    const formData = new FormData();
    formData.append('spending_amount', String(data.spending_amount));
    formData.append('driver_id', String(data.driver_id));
    if (data.spending_type) formData.append('spending_type', data.spending_type);
    if (data.comments)      formData.append('comments', data.comments);
    if (data.contract_id)   formData.append('contract_id', String(data.contract_id));
    if (data.vehicle_id)    formData.append('vehicle_id', String(data.vehicle_id));
    for (const file of files) {
      formData.append('files', file);
    }

    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1];

    const response = await fetch(
      `${apiConfig.baseUrl}${API_ENDPOINTS.SPENDINGS.UPLOAD_FILE}`,
      {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message ?? `Error al registrar: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result?.success) throw new Error(result?.message ?? 'Error desconocido');
    return result.spending as SpendingWithFiles;
  }

  /**
   * Upload file for spending
   * @deprecated Use submit() for new spendings or addFile() to attach to existing ones
   */
  async uploadFile(spendingId: number, file: File, data?: Omit<CreateSpendingRequest, 'driver_id'> & { driver_id: number }): Promise<SpendingFile> {
    const formData = new FormData();
    formData.append('files', file);
    if (data) {
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });
    }

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    const response = await fetch(`${apiConfig.baseUrl}${API_ENDPOINTS.SPENDINGS.UPLOAD_FILE}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return validateResponse<SpendingFile>(result);
  }
}

// Export singleton instance
export const spendingsService = new SpendingsService();
