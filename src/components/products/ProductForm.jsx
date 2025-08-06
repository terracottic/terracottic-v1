import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useProductOperations } from '../../hooks/useProductOperations';
import { useAuth } from '../../contexts/AuthContext';

const ProductForm = ({ product, onSuccess, onCancel }) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: product ? {
            ...product,
            price: product.price || '',
            discountedPrice: product.discountedPrice || ''
        } : {
            name: '',
            description: '',
            price: '',
            discountedPrice: '',
            category: '',
            inStock: true,
            stock: 0,
            rating: 0,
            reviewCount: 0,
            images: [],
            length: 0,
            width: 0,
            height: 0,
            weight: 0
        }
    });
    
    const priceValue = watch('price');
    const watchDiscountedPrice = watch('discountedPrice');

    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imagePreviews, setImagePreviews] = useState(product?.images || []);
    const { saveProduct, isLoading, error } = useProductOperations();
    const { currentUser } = useAuth();
    
    // Initialize discountedPrice from form data
    const [discountedPrice, setDiscountedPrice] = useState(
      product?.discountedPrice || ''
    );
    
    // Keep local state in sync with form state
    useEffect(() => {
      if (watchDiscountedPrice !== undefined && watchDiscountedPrice !== discountedPrice) {
        setDiscountedPrice(watchDiscountedPrice);
      }
    }, [watchDiscountedPrice]);

    const isValidUrl = useCallback((url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    const handleAddImage = () => {
        const url = imageUrlInput.trim();
        if (url && !imagePreviews.includes(url)) {
            setImagePreviews(prev => [...prev, url]);
            setImageUrlInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddImage();
        }
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data) => {
        if (imagePreviews.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        const productData = {
            ...data,
            price: parseFloat(data.price),
            discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
            images: imagePreviews,
            inStock: data.inStock === 'true',
        };

        if (product?.id) {
            productData.id = product.id;
        }

        const result = await saveProduct(productData, currentUser.uid);
        if (result.success) {
            onSuccess?.(result.id);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                    type="text"
                    {...register('name', { required: 'Product name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            {...register('price', {
                                required: 'Price is required',
                                min: { value: 0.01, message: 'Price must be greater than 0' },
                                valueAsNumber: true
                            })}
                            className="pl-7 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                    <label htmlFor="discountedPrice" className="block text-sm font-medium text-gray-700">
                        Discounted Price (₹)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                            id="discountedPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('discountedPrice', {
                                validate: (value) => {
                                    if (!value) return true; // Allow empty
                                    const price = parseFloat(priceValue || 0);
                                    const discounted = parseFloat(value);
                                    if (isNaN(discounted) || discounted < 0) return 'Must be a positive number';
                                    if (discounted >= price) return 'Must be less than original price';
                                    return true;
                                },
                                valueAsNumber: true
                            })}
                            value={discountedPrice || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setDiscountedPrice(value);
                                // Update form value manually to trigger validation
                                const event = { target: { name: 'discountedPrice', value: value || null } };
                                register('discountedPrice').onChange(event);
                            }}
                            className="block w-full pl-7 pr-12 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                            placeholder="0.00"
                            aria-describedby="discounted-price-helper"
                        />
                    </div>
                    {errors.discountedPrice ? (
                        <p className="mt-1 text-sm text-red-600">{errors.discountedPrice.message}</p>
                    ) : discountedPrice && parseFloat(discountedPrice) > 0 && priceValue ? (
                        <p className="mt-1 text-sm text-green-600">
                            {Math.round((1 - (parseFloat(discountedPrice) / parseFloat(priceValue))) * 100)}% off
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-gray-500" id="discounted-price-helper">
                            Leave empty for no discount
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        <div>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Length"
                                {...register('length', {
                                    required: 'Length is required',
                                    min: { value: 0, message: 'Must be positive' },
                                    valueAsNumber: true
                                })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.length && <p className="text-xs text-red-600">{errors.length.message}</p>}
                        </div>
                        <div>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Width"
                                {...register('width', {
                                    required: 'Width is required',
                                    min: { value: 0, message: 'Must be positive' },
                                    valueAsNumber: true
                                })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.width && <p className="text-xs text-red-600">{errors.width.message}</p>}
                        </div>
                        <div>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Height"
                                {...register('height', {
                                    required: 'Height is required',
                                    min: { value: 0, message: 'Must be positive' },
                                    valueAsNumber: true
                                })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.height && <p className="text-xs text-red-600">{errors.height.message}</p>}
                        </div>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        {...register('stock', {
                            required: 'Stock quantity is required',
                            min: { value: 0, message: 'Stock cannot be negative' },
                            valueAsNumber: true
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('weight', {
                                required: 'Weight is required',
                                min: { value: 0, message: 'Weight cannot be negative' },
                                valueAsNumber: true
                            })}
                            className="block w-full pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">kg</span>
                        </div>
                    </div>
                    {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="discountedPrice" className="block text-sm font-medium text-gray-700">
                        Discounted Price (₹)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                            id="discountedPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('discountedPrice', {
                                validate: (value) => {
                                    if (!value) return true; // Allow empty
                                    const price = parseFloat(priceValue || 0);
                                    const discounted = parseFloat(value);
                                    if (isNaN(discounted) || discounted < 0) return 'Must be a positive number';
                                    if (discounted >= price) return 'Must be less than original price';
                                    return true;
                                },
                                valueAsNumber: true
                            })}
                            value={discountedPrice || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setDiscountedPrice(value);
                                // Update form value manually to trigger validation
                                const event = { target: { name: 'discountedPrice', value: value || null } };
                                register('discountedPrice').onChange(event);
                            }}
                            className="block w-full pl-7 pr-12 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                            placeholder="0.00"
                            aria-describedby="discounted-price-helper"
                        />
                    </div>
                    {errors.discountedPrice ? (
                        <p className="mt-1 text-sm text-red-600">{errors.discountedPrice.message}</p>
                    ) : discountedPrice && parseFloat(discountedPrice) > 0 && priceValue ? (
                        <p className="mt-1 text-sm text-green-600">
                            {Math.round((1 - (parseFloat(discountedPrice) / parseFloat(priceValue))) * 100)}% off
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-gray-500" id="discounted-price-helper">
                            Leave empty for no discount
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        {...register('category', { required: 'Category is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">Select a category</option>
                        <option value="pottery">Pottery</option>
                        <option value="sculpture">Sculpture</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="home-decor">Home Decor</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-2">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                value="true"
                                {...register('inStock')}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                defaultChecked
                            />
                            <span className="ml-2">In Stock</span>
                        </label>
                        <label className="inline-flex items-center ml-6">
                            <input
                                type="radio"
                                value="false"
                                {...register('inStock')}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2">Out of Stock</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="mt-1">
                        <select
                            {...register('rating', {
                                required: 'Rating is required',
                                valueAsNumber: true,
                                min: { value: 0, message: 'Minimum rating is 0' },
                                max: { value: 5, message: 'Maximum rating is 5' }
                            })}
                            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(value => (
                                <option key={value} value={value}>
                                    {value === 0 ? 'No rating' : `${value} ★`}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Review Count</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        {...register('reviewCount', {
                            required: 'Review count is required',
                            min: { value: 0, message: 'Review count cannot be negative' },
                            valueAsNumber: true
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.reviewCount && <p className="mt-1 text-sm text-red-600">{errors.reviewCount.message}</p>}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image URL</label>
                    <div className="flex flex-col space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={imageUrlInput}
                                onChange={(e) => setImageUrlInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="https://example.com/image.jpg"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                disabled={!imageUrlInput.trim() || isLoading || !isValidUrl(imageUrlInput)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Add Image
                            </button>
                        </div>
                        {imageUrlInput && !isValidUrl(imageUrlInput) && (
                            <p className="text-sm text-red-600">Please enter a valid URL</p>
                        )}
                        {imageUrlInput && isValidUrl(imageUrlInput) && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                                <div className="border rounded-md p-2 max-w-xs">
                                    <img
                                        src={imageUrlInput}
                                        alt="Preview"
                                        className="w-full h-48 object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                            e.target.className = 'w-full h-48 bg-gray-100 p-4 object-contain';
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {imagePreviews.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Image Previews ({imagePreviews.length})</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative group rounded-md overflow-hidden border border-gray-200">
                                    <img
                                        src={src}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                            e.target.className = 'w-full h-32 bg-gray-100 p-4 object-contain';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                        {src.split('/').pop().substring(0, 20)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <input 
                    type="hidden" 
                    {...register('images')} 
                    value={JSON.stringify(imagePreviews.filter(url => url.trim() !== ''))} 
                />
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : 'Save Product'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
