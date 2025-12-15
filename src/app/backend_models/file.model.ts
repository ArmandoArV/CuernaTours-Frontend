/**
 * File Upload Models
 * 
 * Models for file upload system with support for local and S3 storage
 */

/**
 * File category enumeration
 */
export enum FileCategory {
  PROFILE_PICTURES = 'profile-pictures',
  DOCUMENTS = 'documents',
  CONTRACTS = 'contracts',
  RECEIPTS = 'receipts',
  VEHICLE_PHOTOS = 'vehicle-photos',
  PLACE_PHOTOS = 'place-photos',
  MISC = 'misc',
}

/**
 * File status enumeration
 */
export enum FileStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  PROCESSING = 'processing',
}

/**
 * Entity types for file associations
 */
export enum EntityType {
  USER = 'user',
  CLIENT = 'client',
  CONTRACT = 'contract',
  VEHICLE = 'vehicle',
  TRIP = 'trip',
  SPENDING = 'spending',
}

/**
 * Core File model matching database schema
 */
export interface File {
  file_id: number;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: FileCategory;
  uploaded_by: number;
  uploaded_at: Date;
  description?: string;
  is_public: boolean;
  status: FileStatus;
}

/**
 * File Association model for linking files to entities
 */
export interface FileAssociation {
  association_id: number;
  file_id: number;
  entity_type: EntityType;
  entity_id: number;
  created_at: Date;
  // Relations
  file?: File;
}

/**
 * File with associations for complete file information
 */
export interface FileWithAssociations extends File {
  associations: FileAssociation[];
  file_url: string; // Computed field for frontend
}

/**
 * File upload request interface
 */
export interface FileUploadRequest {
  category: FileCategory;
  entity_type?: EntityType;
  entity_id?: number;
  description?: string;
  is_public?: boolean;
}

/**
 * File upload response interface
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  file?: FileWithAssociations;
  error?: string;
}

/**
 * Multiple file upload response
 */
export interface MultiFileUploadResponse {
  success: boolean;
  message: string;
  files: FileWithAssociations[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

/**
 * File search/filter parameters
 */
export interface FileSearchParams {
  category?: FileCategory;
  entity_type?: EntityType;
  entity_id?: number;
  uploaded_by?: number;
  status?: FileStatus;
  is_public?: boolean;
  mime_type?: string;
  date_from?: Date;
  date_to?: Date;
  search?: string; // Search in original_name or description
  limit?: number;
  offset?: number;
}

/**
 * File list response with pagination
 */
export interface FileListResponse {
  files: FileWithAssociations[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * File deletion request
 */
export interface FileDeleteRequest {
  file_id: number;
  force_delete?: boolean; // Hard delete vs status change
}

/**
 * File deletion response
 */
export interface FileDeleteResponse {
  success: boolean;
  message: string;
  file_id: number;
}

/**
 * File update request (for metadata only)
 */
export interface FileUpdateRequest {
  description?: string;
  is_public?: boolean;
  status?: FileStatus;
}

/**
 * AWS S3 specific interfaces (for future S3 implementation)
 */
export interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
  ACL?: 'private' | 'public-read';
  Metadata?: Record<string, string>;
}

export interface S3UploadResult {
  Location: string;
  Bucket: string;
  Key: string;
  ETag: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  compress?: boolean;
  quality?: number; // For image compression (1-100)
}

/**
 * Create file data transfer object
 */
export interface CreateFileDTO {
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: FileCategory;
  uploaded_by: number;
  description?: string;
  is_public?: boolean;
  status?: FileStatus;
}

/**
 * Create file association data transfer object
 */
export interface CreateFileAssociationDTO {
  file_id: number;
  entity_type: EntityType;
  entity_id: number;
}
