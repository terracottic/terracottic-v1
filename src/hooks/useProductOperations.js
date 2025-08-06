import { useState } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const useProductOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveProduct = async (productData, userId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a reference to the document
      const productRef = productData.id 
        ? doc(db, 'products', productData.id)
        : doc(collection(db, 'products'));
      
      // Prepare the product data for saving
      // Prepare dimensions object if dimensions exist in productData
      const dimensions = productData.dimensions ? {
        widthInches: productData.dimensions.widthInches !== null ? parseFloat(productData.dimensions.widthInches) : null,
        heightInches: productData.dimensions.heightInches !== null ? parseFloat(productData.dimensions.heightInches) : null,
        depthInches: productData.dimensions.depthInches !== null ? parseFloat(productData.dimensions.depthInches) : null,
        widthCm: productData.dimensions.widthCm !== null ? parseFloat(productData.dimensions.widthCm) : null,
        heightCm: productData.dimensions.heightCm !== null ? parseFloat(productData.dimensions.heightCm) : null,
        depthCm: productData.dimensions.depthCm !== null ? parseFloat(productData.dimensions.depthCm) : null
      } : null;

      const productToSave = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price) || 0,
        category: productData.category || 'Uncategorized',
        inStock: Boolean(productData.inStock),
        stock: parseInt(productData.stock) || 0,
        images: Array.isArray(productData.images) ? productData.images : [],
        updatedAt: serverTimestamp(),
        ...(dimensions && { dimensions }), // Only include dimensions if they exist
      };

      // Add creation-specific fields for new products
      if (!productData.id) {
        productToSave.createdAt = serverTimestamp();
        productToSave.createdBy = userId;
        productToSave.rating = 0;
        productToSave.reviewCount = 0;
      }

      console.log('Saving product:', productToSave);
      await setDoc(productRef, productToSave, { merge: true });
      console.log('Product saved successfully with ID:', productRef.id);
      return { success: true, id: productRef.id };
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveProduct,
    deleteProduct,
    isLoading,
    error,
  };
};
