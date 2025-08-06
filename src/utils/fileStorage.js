// src/utils/fileStorage.js
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class FileStorage {
  constructor() {
    this.files = new Map();
  }

  /**
   * Validate a file before upload
   * @param {File} file - The file to validate
   * @throws {Error} If the file is invalid
   */
  validateFile(file) {
    if (!(file instanceof File)) {
      throw new Error('Invalid file provided');
    }
    
    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WebP images are allowed');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }
  }

  /**
   * Generate a unique file name
   * @private
   * @param {string} originalName - The original file name
   * @returns {string} - A unique file name with timestamp
   */
  generateUniqueName(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} [fileName] - Optional custom file name
   * @param {string} [folder='uploads'] - The folder to upload to
   * @returns {Promise<Object>} - The uploaded file details
   */
  async upload(file, fileName, folder = 'uploads') {
    try {
      this.validateFile(file);
      
      // Create a unique file name
      const uniqueFileName = this.generateUniqueName(fileName || file.name);
      const storagePath = `${folder}/${uniqueFileName}`;
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, storagePath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const result = {
        name: uniqueFileName,
        type: file.type,
        size: file.size,
        url: downloadURL,
        path: storagePath,
        uploadedAt: new Date().toISOString()
      };
      
      this.files.set(storagePath, result);
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(error.message || 'Failed to upload file. Please try again.');
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async delete(filePath) {
    try {
      // Create a reference to the file to delete
      const fileRef = ref(storage, filePath);
      
      // Delete the file
      await deleteObject(fileRef);
      
      // Remove from local cache
      this.files.delete(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file. Please try again.');
    }
  }

  /**
   * Get file details by path
   * @param {string} filePath - The path of the file
   * @returns {Object|undefined} - File details if found
   */
  getFile(filePath) {
    return this.files.get(filePath);
  }

  /**
   * Get all uploaded files
   * @returns {Array} - Array of file details
   */
  getAllFiles() {
    return Array.from(this.files.values());
  }

  /**
   * Clear all files from the local cache
   */
  clearCache() {
    this.files.clear();
  }
}

// Create and export a singleton instance
export const fileStorage = new FileStorage();