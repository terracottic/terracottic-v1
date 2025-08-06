import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/contexts/ProductContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chip } from '@mui/material';

// Styled Components
const RelatedProductsSection = styled.section`
  margin: 0;
  padding: 3rem 1rem;
  width: 100%;
  position: relative;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  box-sizing: border-box;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  color: var(--primary);
  margin: 0 0 3rem 0;
  padding: 1rem 4rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(135deg, #f5f5f5, #ffffff);
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
    padding: 0.8rem 2.5rem;
    margin-bottom: 2rem;
  }
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    width: 50%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent), var(--primary));
    border-radius: 3px;
    opacity: 0.7;
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
  
  @media (min-width: 768px) {
    font-size: 2.2rem;
    margin: 0 auto 2.5rem;
    padding: 0.75rem 3rem;
    
    &::before,
    &::after {
      width: 45%;
      height: 4px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 1.6rem;
    padding: 0.5rem 1.5rem;
    
    &::before,
    &::after {
      width: 40%;
      height: 2px;
    }
  }
`;

// Create a base styled component for the grid
const ProductsGridBase = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin: 1.5rem 0;
  position: relative;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

// Apply motion to the base component with variants


// Create the styled component with all styles
const ProductsGrid = styled(motion.div).attrs(() => ({
  initial: "hidden",
  variants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
}))`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 16px 16px;
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-light) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.02);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-light);
    border-radius: 10px;
    transition: background-color 0.3s;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--primary);
  }
  
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    padding: 0 2rem;
    overflow: visible;
  }
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

// Create the styled component with all styles
const ProductCard = styled(motion.div).attrs(() => ({
  initial: "hidden",
  variants: {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        mass: 0.5
      }
    }
  }
}))`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 100%;
  cursor: pointer;
  margin: 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    
    &::before {
      transform: scaleX(1);
    }
  }
  
  @media (min-width: 768px) {
    flex-direction: column;
    width: 280px;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  @media (min-width: 768px) {
    width: 100%;
    max-width: 100%;
    margin-bottom: 0;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ProductImage = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f8f8, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0));
    z-index: 1;
  }
  
  @media (min-width: 768px) {
    width: 100%;
    height: 0;
    padding-top: 100%;
  }
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  @media (max-width: 600px) {
    /* For mobile - make it square but not full height */
    width: 120px;
    height: 120px;
    padding-top: 0;
    border-radius: 8px;
    margin: 8px;
    
    img {
      border-radius: 8px;
    }
  }
  
  .product-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--primary);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.35rem 0.75rem;
    border-radius: 50px;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const DiscountBadge = styled(Chip)`
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  .MuiChip-label {
    padding: 0 0.5rem;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ProductInfo = styled.div`
  padding: 1.25rem 1.25rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  position: relative;
  
  h3 {
    font-size: 1.05rem;
    margin: 0 0 0.5rem;
    color: #2c3e50;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 2.8em;
    transition: color 0.2s ease;
  }
  
  .price {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0.25rem 0 0.5rem;
    
    .currency {
      font-size: 0.9em;
      margin-right: 2px;
    }
  }
  
  .original-price {
    font-size: 0.85rem;
    color: #999;
    text-decoration: line-through;
    margin-right: 0.5rem;
  }
  
  .discount {
    font-size: 0.8rem;
    color: #e53935;
    font-weight: 500;
  }
  
  h3 {
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
    color: #333;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 2.5em;
  }
  
  .description {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 2.5em;
    line-height: 1.4;
  }
  
  .price-container {
    display: flex;
    flex-direction: column;
    margin: 0.5rem 0;
  }
  
  .price-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    line-height: 1.4;
  }
  
  .current-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #333;
  }
  
  .original-price {
    font-size: 0.9rem;
    color: #999;
    text-decoration: line-through;
    margin-left: 0.5rem;
  }
  
  .discount-tag {
    font-size: 0.75rem;
    font-weight: 600;
    color: #e74c3c;
    background: #fde8e8;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    white-space: nowrap;
  }
  
  .rating {
    display: flex;
    align-items: center;
    margin: 0.5rem 0 1rem;
    
    .stars {
      display: flex;
      margin-right: 0.5rem;
    }
    
    .review-count {
      font-size: 0.85rem;
      color: #666;
    }
    
    @media (max-width: 767px) {
      display: none;
    }
  }
`;

const AddToCartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  width: 100%;
  
  &:hover {
    background: #d32f2f;
    transform: translateY(-1px);
  }
  
  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
  }
  
  @media (max-width: 767px) {
    display: none;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SkeletonCard = styled.div`
  background: #f5f5f5;
  border-radius: 10px;
  overflow: hidden;
  height: 100%;
  min-height: 400px;
  
  .skeleton-image {
    width: 100%;
    padding-top: 100%;
    background: #e0e0e0;
  }
  
  .skeleton-content {
    padding: 1.5rem;
    
    div {
      background: #e0e0e0;
      height: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 4px;
      
      &:first-child {
        width: 100%;
        height: 1.5rem;
        margin-bottom: 1rem;
      }
      
      &:nth-child(2) {
        width: 60%;
      }
      
      &:last-child {
        width: 80%;
        height: 2.5rem;
        margin-top: 1.5rem;
      }
    }
  }
`;

// Mock data for related products
const mockRelatedProducts = [
  {
    id: 'rel-1',
    name: 'Handcrafted Terracotta Vase',
    price: 2499,
    originalPrice: 3499,
    discount: 29,
    images: ['/images/terracotta-vase.jpg'],
    rating: 4.5,
    reviewCount: 42,
    category: 'vases'
  },
  {
    id: 'rel-2',
    name: 'Terracotta Planter Set',
    price: 1899,
    originalPrice: 2299,
    discount: 17,
    images: ['/images/terracotta-planter.jpg'],
    rating: 4.2,
    reviewCount: 36,
    category: 'planters'
  },
  {
    id: 'rel-3',
    name: 'Decorative Terracotta Bowl',
    price: 1299,
    originalPrice: 1599,
    discount: 19,
    images: ['/images/terracotta-bowl.jpg'],
    rating: 4.7,
    reviewCount: 28,
    category: 'decor'
  },
  {
    id: 'rel-4',
    name: 'Terracotta Candle Holder',
    price: 899,
    originalPrice: 1199,
    discount: 25,
    images: ['/images/terracotta-candle-holder.jpg'],
    rating: 4.4,
    reviewCount: 31,
    category: 'decor'
  }
];

const RelatedProducts = ({ currentProductId, category }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { products: allProducts } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Handle product click to navigate to product detail page
  const handleProductClick = useCallback((productId) => {
    // Close any open modals or dropdowns if needed
    document.activeElement?.blur();
    
    // Navigate to product detail page
    navigate(`/products/${productId}`);
    
    // Scroll to top of the page after a short delay to ensure the new page has loaded
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [navigate]);

  // Fetch related products
  const fetchRelatedProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If we have all products from context, filter them
      if (allProducts && allProducts.length > 0) {
        // Filter out current product
        let filteredProducts = allProducts.filter(
          product => product.id !== currentProductId
        );
        
        // If category is provided, filter by category (case-insensitive)
        if (category) {
          const categoryLower = category.toLowerCase();
          const categoryFiltered = filteredProducts.filter(
            product => product.category?.toLowerCase() === categoryLower
          );
          
          // Only use category filtered products if we found some
          if (categoryFiltered.length > 0) {
            filteredProducts = categoryFiltered;
          }
        }
        
        setProducts(filteredProducts);
      } else {
        // Fallback to direct Firestore query if context doesn't have products
        const productsCollection = collection(db, 'products');
        let q = query(
          productsCollection,
          where('id', '!=', currentProductId)
        );
        
        if (category) {
          q = query(
            productsCollection,
            where('category', '==', category),
            where('id', '!=', currentProductId)
          );
        }
        
        const querySnapshot = await getDocs(q);
        let productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no products found with category, try without category filter
        if (productsData.length === 0 && category) {
          const fallbackQuery = query(
            productsCollection,
            where('id', '!=', currentProductId)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          productsData = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        
        setProducts(productsData);
      }
      
    } catch (err) {
      console.error('Error fetching related products:', err);
      setError('Failed to load related products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [currentProductId, category]);

  useEffect(() => {
    if (currentProductId) {
      fetchRelatedProducts();
    }
  }, [currentProductId, fetchRelatedProducts]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
  };



  if (isLoading) {
    return (
      <RelatedProductsSection>
        <SectionTitle>You May Also Like</SectionTitle>
        <ProductsGrid>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i}>
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div />
                <div />
                <div />
              </div>
            </SkeletonCard>
          ))}
        </ProductsGrid>
      </RelatedProductsSection>
    );
  }

  if (error) {
    return (
      <RelatedProductsSection>
        <SectionTitle>You May Also Like</SectionTitle>
        <div style={{ textAlign: 'center', color: 'var(--error)', padding: '2rem' }}>
          {error}
        </div>
      </RelatedProductsSection>
    );
  }

  if (products.length === 0) {
    return null; // Don't render anything if no related products
  }

  return (
    <RelatedProductsSection>
      <SectionTitle>You May Also Like</SectionTitle>
      <ProductsGrid initial="hidden" animate="visible">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleProductClick(product.id)}
          >
            <ProductImage>
              <img 
                src={(() => {
                  const image = product.images?.[0];
                  if (!image) return '/placeholder-product.jpg';
                  if (typeof image === 'string') return image;
                  if (typeof image === 'object' && image.url) return image.url;
                  if (typeof image === 'object' && image.src) return image.src;
                  return '/placeholder-product.jpg';
                })()} 
                alt={product.name}
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
            </ProductImage>
            <ProductInfo>
              <h3>{product.name}</h3>
              {product.description && <div className="description">{product.description}</div>}
              <div className="price-container">
                <div className="price-row">
                  {product.discount > 0 ? (
                    <>
                      <span className="current-price" style={{ color: '#8B4513' }}>
                        ₹{Math.round(product.price * (1 - (product.discount / 100)))?.toLocaleString('en-IN')}
                      </span>
                      <span className="original-price">
                        ₹{product.price?.toLocaleString('en-IN')}
                      </span>
                      <Chip
                    label={`${product.discount}% OFF`}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 'bold'
                    }}
                  />
                    </>
                  ) : (
                    <span className="current-price">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
              <div className="rating">
                <div className="stars">
                  {Array(5).fill().map((_, i) => (
                    <FaStar
                      key={i}
                      size={14}
                      color={i < Math.floor(product.rating || 0) ? '#FFD700' : '#E0E0E0'}
                    />
                  ))}
                </div>
                {product.reviewCount > 0 && (
                  <span className="review-count">({product.reviewCount})</span>
                )}
              </div>
              <AddToCartButton 
                onClick={(e) => handleAddToCart(e, product)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaShoppingCart /> Add to Cart
              </AddToCartButton>
            </ProductInfo>
          </ProductCard>
        ))}
      </ProductsGrid>
    </RelatedProductsSection>
  );
};

export default RelatedProducts;
