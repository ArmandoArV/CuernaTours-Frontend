/**
 * Files Service
 * 
 * Handles file upload and management API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { FileCategory } from '@/app/backend_models/file.model';

export interface FileUploadResponse {
  file_id: number;
  file_url: string;
  original_name: string;
  stored_name: string;
}

export interface FileInfo {
  file_id: number;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: FileCategory;
  uploaded_by: number;
  uploaded_at: Date;
  file_url: string;
}

class FilesService {
  /**
   * Upload a file
   */
  async upload(
    file: File,
    category: FileCategory,
    metadata?: {
      entity_type?: string;
      entity_id?: number;
      description?: string;
    }
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    if (metadata) {
      if (metadata.entity_type) formData.append('entity_type', metadata.entity_type);
      if (metadata.entity_id) formData.append('entity_id', metadata.entity_id.toString());
      if (metadata.description) formData.append('description', metadata.description);
    }

    // Use fetch directly for FormData uploads
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    const response = await fetch(`${API_ENDPOINTS.FILES.UPLOAD}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return validateResponse<FileUploadResponse>(data);
  }

  /**
   * Get file by ID
   */
  async getById(fileId: number): Promise<FileInfo> {
    const endpoint = API_ENDPOINTS.FILES.BY_ID(fileId);
    const response = await apiClient.get<FileInfo>(endpoint);
    return validateResponse<FileInfo>(response);
  }

  /**
   * Get files by entity
   */
  async getByEntity(entityType: string, entityId: number): Promise<FileInfo[]> {
    const endpoint = API_ENDPOINTS.FILES.BY_ENTITY(entityType, entityId);
    const response = await apiClient.get<FileInfo[]>(endpoint);
    return validateResponse<FileInfo[]>(response);
  }

  /**
   * Download file
   */
  getDownloadUrl(fileId: number): string {
    return API_ENDPOINTS.FILES.DOWNLOAD(fileId);
  }

  /**
   * Delete file
   */
  async delete(fileId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.FILES.BY_ID(fileId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }
}

// Export singleton instance
export const filesService = new FilesService();
