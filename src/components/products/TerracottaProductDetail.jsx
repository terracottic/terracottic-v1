import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RelatedProducts from './RelatedProducts';
import ProductAssuranceInfo from './ProductAssuranceInfo';
import { FaHeart, FaShare, FaBolt,
  FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar, FaPlus, FaMinus, FaPalette, FaSearchPlus,
  FaShieldAlt, FaHandsHelping, FaCertificate, FaBoxOpen, FaBell, FaClock } from 'react-icons/fa';
import ZoomModal from './ZoomModal';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { outOfStockApi } from '@/services/api';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import ShareModal from '../common/ShareModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomizationForm from './CustomizationForm';
import { Chip, IconButton, useTheme, useMediaQuery } from '@mui/material';

// Keyframe animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const attentionPulse = keyframes`
  0% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
`;

const brushStroke = keyframes`
  0% { opacity: 0; transform: translateX(-100%) rotate(-10deg); }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateX(100%) rotate(10deg); }
`;

// Description Content Styles
const DescriptionContent = styled.div`
  padding: 1.25rem;
  position: relative;
  max-height: none;
  overflow: visible;
  transition: max-height 0.4s ease-in-out;
  
  > div {
    color: #555;
    line-height: 1.7;
    font-size: 0.95rem;
    position: relative;
    padding-right: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
    width: 100%;
    box-sizing: border-box;
    white-space: pre-line;
  }
`;

const DescriptionHeader = styled.div`
  padding: 1.25rem;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  
  h3 {
    margin: 0 0 0.75rem;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #8B5E3C;
    --primary-light: #B88B6A;
    --primary-dark: #5D4037;
    --accent: #D4A76A;
    --text: #333333;
    --text-light: #666666;
    --background: #FFF9F2;
    --card-bg: #FFFFFF;
    --success: #4CAF50;
    --error: #F44336;
    --border-radius: 12px;
    --shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  body {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.6;
    transition: all 0.3s ease;
    
    /* When modal is open */
    &.modal-open {
      overflow: hidden;
      touch-action: none;
      -webkit-overflow-scrolling: touch;
      position: fixed;
      width: 100%;
      height: 100%;
      
      /* Ensure content stays in place */
      &::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2147483646; /* Just below the modal */
        pointer-events: none;
      }
    }
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  /* Ensure all content stays below modal */
  body > *:not(.modal-open) {
    position: relative;
    z-index: 1;
  }
`;

// Styled Components
const PaintContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  
  &.active {
    pointer-events: all;
    opacity: 1;
  }
`;

const BrushStroke = styled.div`
  position: absolute;
  width: 200%;
  height: 100px;
  background: linear-gradient(90deg, transparent, #d2691e, transparent);
  opacity: 0.1;
  transform: rotate(-10deg);
  animation: ${brushStroke} 2s ease-in-out infinite;
  pointer-events: none;
`;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--background);
  position: relative;
  overflow-x: hidden;
  padding: 0;
  margin: 0;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  padding-top: calc(80px + env(safe-area-inset-top));
  -webkit-overflow-scrolling: touch;
`;

const ProductGrid = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 120px;
  align-items: flex-start;
  
  @media (max-width: 1024px) {
    gap: 1.75rem;
    padding: 1.25rem 1.5rem 120px;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 1.25rem 140px;
    margin-top: 0;
  }
  
  @media (max-width: 480px) {
    gap: 1.25rem;
    padding: 0.75rem 1rem 140px;
  }
  
  @supports (-webkit-touch-callout: none) {
    padding-bottom: calc(140px + env(safe-area-inset-bottom));
  }
  
  /* Image gallery column */
  > div:first-child {
    flex: 1;
    max-width: 55%;
    position: sticky;
    top: 100px;
    align-self: flex-start;
    
    @media (max-width: 768px) {
      max-width: 100%;
      position: static;
      width: 100%;
    }
  }
  
  /* Product info column */
  > div:last-child {
    flex: 1;
    max-width: 45%;
    
    @media (max-width: 768px) {
      max-width: 100%;
      width: 100%;
    }
  }
`;

const ImageGallery = styled.div`
  position: relative;
  width: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  background: var(--card-bg);
  padding: 1.5rem;
  transition: var(--transition);
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Thumbnails = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;


const CloseButton = styled.button`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10001; /* Above the zoom modal */
  padding: 0;
  transition: all 0.2s ease;
  color: white;
  font-size: 1.5rem;
  line-height: 1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  }
`;

const Thumbnail = styled(motion.div)`
  min-width: 70px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.$active ? 'var(--primary)' : 'transparent'};
  transition: var(--transition);
  background: white;
  flex-shrink: 0;
`;

const MainImage = styled(motion.div)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme?.shape?.borderRadius || '8px',
  overflow: 'hidden',
  backgroundColor: 'white',
  boxShadow: theme?.shadows?.[2] || '0 2px 8px rgba(0,0,0,0.1)',
  aspectRatio: '1/1',
  cursor: 'zoom-in',
  transition: 'all 0.3s ease',

  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme?.shadows?.[4] || '0 4px 20px rgba(0,0,0,0.15)',
    '& .zoom-overlay': {
      opacity: 1,
    },
  },
  '& img': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  '.zoom-overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '& svg': {
      color: 'white',
      fontSize: '2rem',
    },
  },
}));

const ProductInfo = styled.div`
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  height: auto;
  min-height: 0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-light);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 2.5rem 0;
  width: 100%;
  max-width: 600px;
  
  & > * {
    flex: 1;
    min-width: 120px;
  }
  
  @media (max-width: 768px) {
    position: relative;
    background: transparent;
    padding: 10px 16px;
    margin: 1.25rem 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 100%;
    
    & > * {
      width: 100%;
      height: 48px;
      padding: 0.6rem 1rem;
      font-size: 0.95rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      
      /* Hide icons on mobile */
      svg {
        display: none;
      }
      .button-text {
      font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.3px;
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }
      
      /* Specific styles for Add to Cart button */
      &[style*="addToCart"] {
        background: var(--primary);
        color: white;
      }
      
      /* Specific styles for Buy Now button */
      &[style*="buyNow"] {
        background: #8b4513;
        color: white;
        font-weight: 600;
        letter-spacing: 0.5px;
        padding: 0.7rem 1.2rem;
        
        .button-text {
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      }
      
      /* Specific styles for Customize button */
      &[style*="customize"] {
        background: #f5f0e6; /* Light beige color */
        color: #5d4037; /* Dark brown text */
        border: 1px solid #d7ccc8; /* Light brown border */
        box-shadow: 0 2px 4px rgba(73, 32, 13, 0.84); /* Subtle shadow for depth */
        transition: all 0.2s ease; /* Smooth hover effect */
        margin-left: 0 !important; /* Ensure no left margin */
        margin-right: 0 !important; /* Ensure no right margin */
        width: 100%; /* Ensure full width */
        
        .button-text {
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.3px;
          margin: 0 auto; /* Center the text */
        }
      }
    }
  }
  
  @media (max-width: 400px) {
    padding: 10px 12px;
    gap: 8px;
    
    & > * {
      height: 46px;
      padding: 0.5rem 0.8rem;
      font-size: 0.9rem;
      
      .button-text {
        font-size: 0.9rem;
      }
    }
  }
`;


const Title = styled.h1`
  font-size: 2.25rem;
  color: var(--primary-dark);
  margin-bottom: 1.25rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.5px;
  position: relative;
  padding-bottom: 1rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    border-radius: 3px;
  }
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }
`;

const DimensionsSection = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
`;

const DimensionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const DimensionsTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
`;

const UnitToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const UnitButton = styled.button`
  background: ${props => props.$active ? 'var(--primary)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-dark)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const DimensionsContent = styled.div`
  padding: 1rem 0;
`;

const DimensionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const DimensionLabel = styled.span`
  font-weight: 500;
  color: var(--text-light);
  min-width: 100px;
`;

const DimensionValue = styled.span`
  font-weight: 600;
  color: var(--text);
`;

const Button = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.9rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 50px;
  border: none;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: var(--transition);
  }
  
  &:hover::after {
    opacity: 1;
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  svg {
    width: 18px;
    height: 18px;
    min-width: 18px;
    min-height: 18px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 0.85rem 1.5rem;
    font-size: 0.95rem;
    
    svg {
      width: 16px;
      height: 16px;
      min-width: 16px;
      min-height: 16px;
    }
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2);
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(30deg);
    animation: shine 5s infinite;
    opacity: 0;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes subtlePulse {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.02); }
    100% { transform: translateY(0) scale(1); }
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) rotate(30deg); opacity: 0; }
    20% { opacity: 0.5; }
    40% { transform: translateX(100%) rotate(30deg); opacity: 0; }
    100% { opacity: 0; }
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.5);
    animation-play-state: paused;
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

// Price display components
const PriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.5rem 0;
  flex-wrap: wrap;
`;

const CurrentPrice = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Poppins', sans-serif;
`;

const OriginalPrice = styled.span`
  font-size: 1.1rem;
  color: #888;
  text-decoration: line-through;
  font-weight: 500;
`;

const DiscountBadge = styled.span`
  background: #ffebee;
  color: #e53935;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: var(--primary);
  border: 2px solid var(--primary);
  
  &:hover {
    background: rgba(139, 94, 60, 0.05);
  }
`;

const CustomizationButton = styled(Button)`
  background: linear-gradient(135deg, #8B5E3C, #B88B6A, #D4A76A, #B88B6A, #8B5E3C);
  background-size: 300% 100%;
  color: white;
  border: none;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #A87C5B, #D4A76A, #F5D6BA, #D4A76A, #A87C5B);
    background-size: 300% 100%;
    opacity: 0;
    z-index: -1;
    transition: all 0.4s ease;
  }
  
  &:hover::before {
    opacity: 1;
    animation: gradientBG 4s ease infinite;
  }
  
  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  width: 100%;
  padding: 0.9rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;
  box-shadow: 0 4px 15px rgba(109, 76, 65, 0.3);
  animation: gradientShift 6s ease infinite, subtlePulse 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(30deg);
    animation: shine 4s infinite;
    opacity: 0;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes subtlePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) rotate(30deg); opacity: 0; }
    20% { opacity: 0.5; }
    40% { transform: translateX(100%) rotate(30deg); opacity: 0; }
    100% { opacity: 0; }
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(109, 76, 65, 0.5);
    animation-play-state: paused;
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
  
  svg {
    font-size: 1.1em;
  }
`;

const BuyNowButton = styled(Button)`
  background: #8b4513;
  color: white;
  border: none;
  position: relative;
  overflow: hidden;
  padding: 0.9rem 2rem 0.9rem 3rem;
  box-shadow: 0 4px 15px rgba(139, 94, 60, 0.3);
  animation: ${pulse} 2s infinite;
  
  .bolt-icon {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.1em;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .button-text {
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 1.5rem;
    height: 1.5rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  &:hover {
    animation: none;
    background: #7a3c10;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.4);
    
    .bolt-icon {
      transform: translateY(-50%) scale(1.1);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.loading {
    animation: none;
    pointer-events: none;
    
    .bolt-icon, .button-text {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .spinner {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      animation: spin 1s linear infinite;
    }
  }
  
  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

const CustomIconButton = styled(motion.button)`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e0e0e0;
  color: var(--text);
  cursor: pointer;
  transition: var(--transition);
  
  svg {
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
  }
  
  &:hover {
    background: #f5f5f5;
    color: var(--primary);
    border-color: var(--primary-light);
    transform: translateY(-2px);
    
    svg {
      transform: scale(1.1);
    }
  }
  
  &.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    
    svg {
      color: white;
    }
  }
  
  @media (max-width: 480px) {
    width: 42px;
    height: 42px;
    
    svg {
      width: 18px;
      height: 18px;
      min-width: 18px;
      min-height: 18px;
    }
  }
`;

// Quantity Selector
// Section Title
const MainSectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 2.5rem;
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: var(--primary);
  }
`;

/* Related Products Section */
const RelatedProductsSection = styled.section`
  margin: 6rem auto 4rem;
  padding: 4rem 2rem;
  max-width: 1440px;
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.05);
  
  @media (max-width: 768px) {
    padding: 3rem 1.5rem;
    margin: 4rem 1rem 3rem;
  }
  
  @media (max-width: 480px) {
    padding: 2rem 1rem;
    margin: 3rem 0.5rem 2rem;
  }
`;

const RelatedProductsTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  padding-bottom: 1rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: var(--primary);
    border-radius: 3px;
  }
`;

// Define grid variants for animation
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const RelatedProductsGrid = styled(motion.div).attrs(() => ({
  initial: "hidden",
  variants: gridVariants
}))`
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
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const ProductImage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1/1; /* Maintain square aspect ratio */
  max-height: 500px; /* Set a maximum height */
  overflow: hidden;
  background: linear-gradient(135deg, #f9f9f9, #f0f0f0);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    opacity: 0;
    transition: opacity 0.4s ease;
    mix-blend-mode: multiply;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
    will-change: transform;
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

// Define animation variants for better performance and reusability
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -5,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  }
};

const ProductCard = styled(motion.div).attrs(() => ({
  initial: "hidden",
  variants: cardVariants,
  viewport: { once: true, margin: "-50px" }
}))`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transform: translateZ(0);
  
  &:hover {
    ${props => props.animate !== false && `
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    `}
  }
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
    
    &::before {
      opacity: 1;
    }
    
    ${ProductImage}::after {
      opacity: 0.1;
    }
    
    img {
      transform: scale(1.08);
    }
  }
  
  &:active {
    transform: translateY(-4px) scale(1.005);
  }
`;

const ProductCardInfo = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  background: white;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.1), white);
    z-index: -1;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 3em;
    line-height: 1.4;
    transition: color 0.3s ease;
    
    ${ProductCard}:hover & {
      color: var(--primary);
    }
  }

  .price {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.5rem 0 0.75rem;
    flex-wrap: wrap;
    align-items: flex-end;

    .current-price {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary);
      line-height: 1;
      font-family: 'Poppins', sans-serif;
      letter-spacing: -0.5px;
    }

    .original-price {
      font-size: 1rem;
      color: var(--text-light);
      text-decoration: line-through;
      font-weight: 500;
    }

    .discount {
      background: linear-gradient(135deg, #ff4d4d, #ff1a75);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      margin-left: auto;
      box-shadow: 0 2px 8px rgba(255, 77, 77, 0.3);
    }
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0 1.25rem;

    .stars {
      display: flex;
      gap: 0.15rem;
      
      svg {
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
      }
    }

    .review-count {
      font-size: 0.85rem;
      color: var(--text-light);
      font-weight: 500;
    }
  }
`;

const AddToCartButton = styled(motion.button).attrs(() => ({
  whileHover: {
    y: -2,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
  },
  whileTap: {
    y: 0,
    scale: 0.98
  }
}))`
  margin-top: auto;
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  svg {
    font-size: 1.1em;
    transition: transform 0.3s ease;
  }
  
  &:hover svg {
    transform: translateX(3px);
  }
  
  @media (max-width: 480px) {
    padding: 0.8rem 1.25rem;
    font-size: 0.9rem;
  }
`;

// Skeleton loading card for related products
const SkeletonCard = styled(motion.div).attrs(() => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
}))`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  height: 100%;
  
  .skeleton-image {
    width: 100%;
    padding-top: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-content {
    padding: 1.5rem;
    
    div {
      height: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 0.75rem;
      
      &:first-child {
        width: 80%;
        height: 1.5rem;
        margin-bottom: 1rem;
      }
      
      &:nth-child(2) {
        width: 50%;
      }
      
      &:last-child {
        width: 100%;
        height: 2.75rem;
        margin-top: 1rem;
        border-radius: 8px;
      }
    }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.75rem 0;
  
  .label {
    font-weight: 500;
    color: var(--text);
    min-width: 100px;
  }
  
  .controls {
    display: flex;
    align-items: center;
    background: #f9f9f9;
    border-radius: 50px;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
  }
  
  .quantity {
    min-width: 40px;
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: white;
    color: var(--primary);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    
    &:hover {
      background: var(--primary);
      color: white;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f0f0f0;
      color: #999;
    }
  }
`;

// Product Meta
const ProductMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1.5rem 0;
  padding: 1.25rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-light);
    
    svg {
      color: var(--primary);
      font-size: 1.1em;
    }
    
    .label {
      font-weight: 500;
      margin-right: 0.25rem;
    }
    
    .value {
      font-weight: 600;
      color: var(--text);
    }
  }
  
  @media (max-width: 768px) {
    gap: 1rem;
    
    .meta-item {
      width: calc(50% - 0.5rem);
    }
  }
`;

// Features List
const FeaturesList = styled.ul`
  margin: 1.5rem 0;
  padding-left: 1.25rem;
  
  li {
    margin-bottom: 0.75rem;
    position: relative;
    padding-left: 1.75rem;
    line-height: 1.6;
    color: var(--text);
    
    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--primary);
      font-weight: bold;
    }
  }
`;

// Tabs
const Tabs = styled.div`
  margin: 2.5rem 0 1rem;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1.5rem;
`;

/* Related Products Card */
const RelatedProductCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    
    img {
      transform: scale(1.05);
    }
  }
`;

const RelatedProductImage = styled.div`
  position: relative;
  padding-top: 100%;
  overflow: hidden;
  background: #f9f9f9;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
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

const RelatedProductCardInfo = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  
  h3 {
    font-size: 1.1rem;
    margin: 0 0 0.75rem;
    color: #333;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 3em;
  }
  
  .price {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
  }
  
  .original-price {
    font-size: 0.9rem;
    color: #999;
    text-decoration: line-through;
  }
  
  .discount {
    font-size: 0.8rem;
    font-weight: 600;
    color: #e74c3c;
    background: #fde8e8;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
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
  }
`;

// Why Buy From Us Section Styles
const WhyBuyContainer = styled.div`
  background: linear-gradient(135deg, #fff9f2, #fff);
  border-radius: 16px;
  padding: 3rem 2.5rem;
  margin: 2.5rem 0;
  box-shadow: 0 8px 32px rgba(139, 94, 60, 0.1);
  border: 1px solid rgba(139, 94, 60, 0.1);
  text-align: center;
  
  @media (max-width: 1024px) {
    padding: 2.25rem 2rem;
    margin: 2rem 0;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
    margin: 1.25rem 0;
  }
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
  }
`;

const WhyBuyTitle = styled.h3`
  font-size: 2rem;
  color: var(--primary-dark);
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  
  @media (max-width: 1024px) {
    font-size: 1.75rem;
    margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 1.35rem;
    margin-bottom: 1.25rem;
  }
  position: relative;
  
  svg {
    color: var(--primary);
    font-size: 1.5em;
  }
  
  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: var(--primary);
    margin: 0.75rem auto 0;
  }
`;

const WhyBuyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 1.75rem;
  
  @media (max-width: 1024px) {
    gap: 1.25rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 100%;
    gap: 1rem;
    margin-top: 1rem;
    margin-right: auto;
  }
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  @media (max-width: 1024px) {
    padding: 1rem;
    gap: 0.875rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem;
    gap: 0.75rem;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-light);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .icon {
    font-size: 1.75rem;
    color: var(--primary);
    min-width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(139, 94, 60, 0.1);
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.25rem;
    
    @media (max-width: 1024px) {
      font-size: 1.35rem;
      min-width: 2rem;
      height: 2rem;
    }
    
    @media (max-width: 768px) {
      font-size: 1.25rem;
      min-width: 1.75rem;
      height: 1.75rem;
    }
    border: 1px solid #e0e0e0;
  }
  
  .quantity {
    min-width: 40px;
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  h4 {
    font-size: 1.1rem;
    margin: 0 0 0.4rem 0;
    color: var(--text-dark);
    
    @media (max-width: 1024px) {
      font-size: 1rem;
      margin-bottom: 0.3rem;
    }
    
    @media (max-width: 768px) {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
  }
  
  p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-light);
    line-height: 1.5;
    
    @media (max-width: 1024px) {
      font-size: 0.9rem;
      line-height: 1.45;
    }
    
    @media (max-width: 768px) {
      font-size: 0.85rem;
      line-height: 1.4;
    }
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

const RelatedAddToCartButton = styled.button`
  margin-top: auto;
  width: 100%;
  padding: 0.7rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Stock Status Component
const StockStatus = styled.div`
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  
  &.in-stock {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
    animation: ${pulse} 2s infinite;
  }
  
  &.low-stock {
    background-color: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    animation: ${pulse} 1.5s infinite;
  }
  
  &.out-of-stock {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.2);
    animation: ${fadeIn} 0.5s ease-out, ${shake} 0.5s 0.5s ease, ${attentionPulse} 2s 1s ease-in-out infinite;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transform: translateX(-100%);
      animation: shine 2s infinite;
    }
    
    @keyframes shine {
      100% {
        transform: translateX(100%);
      }
    }
  }
  
  .stock-icon {
    font-size: 1.1em;
  }
`;

const RelatedSkeletonCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  
  .skeleton-image {
    padding-top: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  .skeleton-content {
    padding: 1.5rem;
    
    div {
      height: 1rem;
      background: #f5f5f5;
      margin-bottom: 0.75rem;
      border-radius: 4px;
      
      &:first-child {
        height: 1.5rem;
        width: 80%;
      }
      
      &:nth-child(2) {
        width: 60%;
      }
      
      &:last-child {
        width: 40%;
        margin-top: 1.5rem;
        height: 2.5rem;
        border-radius: 5px;
      }
    }
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const Tab = styled.button`
  padding: 0.8rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--primary);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &.active {
    color: var(--primary);
    
    &::after {
      transform: scaleX(1);
    }
  }
  
  &:hover:not(.active) {
    color: var(--primary);
    background: rgba(139, 94, 60, 0.05);
  }
`;

const TabPanel = styled.div`
  padding: 1rem 0;
  line-height: 1.7;
  color: var(--text);
  
  p {
    margin-bottom: 1rem;
  }
`;

const TerracottaProductDetail = ({ product: initialProduct }) => {
  // State declarations at the top of the component
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState({ success: false, message: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMetric, setIsMetric] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(() => ({
    name: initialProduct?.name || 'Terracotta Product',
    description: initialProduct?.description || 'Beautiful handcrafted terracotta product',
    images: initialProduct?.images || ['/placeholder-product.jpg'],
    price: initialProduct?.price || 0,
    originalPrice: initialProduct?.originalPrice || 0,
    rating: initialProduct?.rating || 0,
    reviewCount: initialProduct?.reviewCount || 0,
    features: initialProduct?.features || [],
    specifications: initialProduct?.specifications || {},
    deliveryInfo: initialProduct?.deliveryInfo || {},
    inStock: initialProduct?.inStock !== undefined ? initialProduct.inStock : true,
    stock: initialProduct?.stock || 0
  }));

  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState('');
  
  const handleAddToCart = async () => {
    if (productData.stock === 0) {
      setAddToCartError('This product is out of stock');
      return;
    }
    
    if (quantity < 1) {
      setAddToCartError('Please select at least 1 item');
      return;
    }
    
    try {
      setIsAddingToCart(true);
      setAddToCartError('');
      
      // Prepare product data for cart
      const cartProduct = {
        id: productData.id || id,
        name: productData.name,
        price: productData.originalPrice || productData.price, // Use originalPrice as base price if available
        discountedPrice: productData.price, // Current price is the discounted price
        image: Array.isArray(productData.images) ? productData.images[0] : productData.images,
        stock: productData.stock,
        discount: productData.discount || 0,
        category: productData.category,
        slug: productData.slug
      };
      
      const result = await addToCart(cartProduct, quantity);
      
      if (result.success) {
        toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart!`, {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        // If there's a suggested quantity, update the quantity and show a message
        if (result.suggestedQuantity) {
          setQuantity(result.suggestedQuantity);
          toast.info(`Adjusted quantity to ${result.suggestedQuantity} based on available stock`, {
            position: "bottom-right",
            autoClose: 3000,
          });
        }
        throw new Error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Only show error if it's not a max reached error (already handled by toast)
      if (error.message !== 'Maximum available quantity already in cart') {
        setAddToCartError(error.message || 'Failed to add to cart. Please try again.');
      }
      
      toast.error(error.message || 'Failed to add to cart', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const fetchProduct = useCallback(async () => {
    if (!initialProduct && id) {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        // const response = await fetch(`/api/products/${id}`);
        // const data = await response.json();
        // setProductData(data);
        // return data;
        return initialProduct || {};
      } catch (err) {
        console.error('Error fetching product:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    }
    return initialProduct;
  }, [id, initialProduct]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const product = await fetchProduct();
      if (product) {
        // Create a complete product object with all required fields
        const completeProduct = {
          ...product,
          id: product.id || id, // Ensure we have an ID
          name: product.name || 'Terracotta Product',
          description: product.description || 'Beautiful handcrafted terracotta product',
          images: Array.isArray(product.images) ? product.images : [product.images || '/placeholder-product.jpg'].filter(Boolean),
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          features: product.features || [],
          specifications: product.specifications || {},
          deliveryInfo: product.deliveryInfo || {},
          inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0),
          stock: product.stock || 0
        };

        // Set product data
        setProductData(completeProduct);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, initialProduct, fetchProduct]);

  const isLoadingState = isLoading && !productData?.id;

  const canvasRef = useRef(null);
  const mainImageRef = useRef(null);
  const zoomRef = useRef(null);
  const imageRef = useRef(null);

  const toggleUnitSystem = () => {
    setIsMetric(prev => !prev);
  };

  const formatDimensions = useCallback((width, height, depth) => {
    // If any dimension is missing or zero, return empty string
    if (!width && !height) return '';

    const hasDepth = depth && depth > 0;

    if (isMetric) {
      return hasDepth
        ? `W ${width} × H ${height} × D ${depth} cm`
        : `W ${width} × H ${height} cm`;
    } else {
      // Convert cm to inches (1 cm = 0.393701 inches)
      const toInches = (cm) => (cm * 0.393701).toFixed(1);
      return hasDepth
        ? `W ${toInches(width)} × H ${toInches(height)} × D ${toInches(depth)} in`
        : `W ${toInches(width)} × H ${toInches(height)} in`;
    }
  }, [isMetric]);

  const formatWeight = useCallback((weightGrams) => {
    if (isMetric) {
      return weightGrams >= 1000
        ? `${(weightGrams / 1000).toFixed(1)} kg`
        : `${weightGrams} g`;
    } else {
      // Convert grams to pounds (1 g = 0.00220462 lbs)
      const pounds = weightGrams * 0.00220462;
      return pounds >= 1
        ? `${pounds.toFixed(1)} lb`
        : `${(pounds * 16).toFixed(1)} oz`;
    }
  }, [isMetric]);

  const openZoomModal = useCallback((index) => {
    setCurrentImageIndex(index);
    setIsZoomModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeZoomModal = useCallback(() => {
    setIsZoomModalOpen(false);
    document.body.style.overflow = 'unset';
  }, []);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // In a real app, you would update the wishlist in your state management here
  };

  const handleWaitlistClick = () => {
    // Check if user is authenticated by checking if currentUser exists
    if (!currentUser) {
      toast.info('Please login first to join the waitlist');
      return;
    }
    
    // Pre-fill form with user data if available
    setFormData({
      name: currentUser.displayName || currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phoneNumber || currentUser.phone || ''
    });
    
    setShowWaitlistForm(true);
  };
  
  // Check if name is available and should be read-only
  const isNameReadOnly = Boolean(currentUser?.displayName || currentUser?.name);
  
  // Check if phone is available and should be read-only
  const isPhoneReadOnly = Boolean(currentUser?.phoneNumber || currentUser?.phone);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.phone) {
        throw new Error('Please enter your phone number');
      }
      
      // Phone number validation (basic check for 10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Get Firestore instance
      const { doc, setDoc, serverTimestamp, collection } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');

      // Create waitlist entry
      const waitlistRef = doc(collection(db, 'outOfStockWaitlist'));
      const waitlistData = {
        id: waitlistRef.id,
        productId: productData.id || id,
        productName: productData.name || 'Unknown Product',
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: cleanPhone,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notified: false,
        userId: currentUser?.uid || 'anonymous',
      };

      // Save to Firestore
      await setDoc(waitlistRef, waitlistData);
      
      // Show success message
      setWaitlistStatus({
        success: true,
        message: 'You\'ve been added to the waitlist for this product! We\'ll notify you when it\'s back in stock.'
      });
      
      // Close the form and show success toast
      setShowWaitlistForm(false);
      toast.success('Added to waitlist successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error(error.message || 'Failed to add to waitlist. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    if (productData.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    if (quantity < 1) {
      toast.error('Please select at least 1 item');
      return;
    }
  
    try {
      // Prepare product data for direct checkout
      const directCheckoutProduct = {
        id: productData.id || id,
        name: productData.name,
        // Use the discounted price as the main price
        price: productData.discountedPrice || productData.price,
        // Store the original price if available, otherwise use the same as price
        originalPrice: productData.originalPrice || productData.price,
        // For backward compatibility
        discountedPrice: productData.discountedPrice || productData.price,
        image: Array.isArray(productData.images) ? productData.images[0] : productData.images,
        stock: productData.stock,
        discount: productData.discount || 0,
        category: productData.category,
        slug: productData.slug,
        quantity: quantity,
        packagingPrice: productData.packagingPrice,
        isDirectCheckout: true // Flag to identify direct checkout in the CheckoutPage
      };
  
      // Navigate to checkout with the product data in state
      navigate('/checkout', { 
        state: { 
          directCheckoutItem: directCheckoutProduct 
        } 
      });
      
    } catch (error) {
      console.error('Error during direct checkout:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev =>
      prev < (productData?.images?.length || 1) - 1 ? prev + 1 : 0
    );
  }, [productData?.images?.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex(prev =>
      prev > 0 ? prev - 1 : (productData?.images?.length || 1) - 1
    );
  }, [productData?.images?.length]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} color="#FFC107" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} color="#FFC107" />);
      } else {
        stars.push(<FaRegStar key={i} color="#E0E0E0" />);
      }
    }

    return stars;
  };

  if (isLoadingState) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading product details...</div>
        <div style={{ color: 'var(--text-light)' }}>Please wait while we load the product information</div>
      </div>
    );
  }

  const {
    name,
    price,
    originalPrice,
    discount,
    rating,
    reviewCount,
    images,
    description,
    features,
    specifications,
    deliveryInfo,
    category = ''
  } = productData;

  return (
    <>
      <GlobalStyle />
      <Container>
        <ProductGrid>
          {/* Image Gallery */}
          <ImageGallery>
            <MainImage
              onClick={() => {
                const image = productData?.images?.[currentImageIndex];
                if (!image) return;
                const imageUrl = typeof image === 'string' ? image : image.url || image.src;
                if (imageUrl) openZoomModal(currentImageIndex);
              }}
            >

              <LazyLoadImage
                src={(() => {
                  const image = productData?.images?.[currentImageIndex];
                  if (!image) return '/placeholder-product.jpg';
                  if (typeof image === 'string') return image;
                  if (typeof image === 'object' && image.url) return image.url;
                  if (typeof image === 'object' && image.src) return image.src;
                  return '/placeholder-product.jpg';
                })()}
                alt={productData?.name || 'Product Image'}
                effect="blur"
                width="100%"
                height="100%"
                style={{ objectFit: 'cover', cursor: 'zoom-in' }}
              />
              <div className="zoom-indicator">
                <FaSearchPlus />
                Click to zoom
              </div>
            </MainImage>

            <Thumbnails>
              {(productData?.images || []).map((img, index) => (
                <Thumbnail
                  key={index}
                  $active={currentImageIndex === index}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <LazyLoadImage
                    src={typeof img === 'object' ? (img.url || '/placeholder-product.jpg') : img}
                    alt={`${productData.name} - View ${index + 1}`}
                    effect="blur"
                    width="100%"
                    height="100%"
                  />
                </Thumbnail>
              ))}
            </Thumbnails>
            
            {/* Why Buy From Us Section */}
            <WhyBuyContainer>
              <WhyBuyTitle>
                <FaShieldAlt /> Why Buy From Us
              </WhyBuyTitle>
              <WhyBuyGrid>
                <BenefitItem>
                  <div className="icon">
                    <FaShieldAlt />
                  </div>
                  <div className="content">
                    <h4>Only On Terracottic</h4>
                    <p>Exclusive designs crafted with care, available only through our platform.</p>
                  </div>
                </BenefitItem>
                
                <BenefitItem>
                  <div className="icon">
                    <FaHandsHelping />
                  </div>
                  <div className="content">
                    <h4>Direct from Artisans</h4>
                    <p>Support local artisans directly with no middlemen, ensuring fair wages.</p>
                  </div>
                </BenefitItem>
                
                <BenefitItem>
                  <div className="icon">
                    <FaCertificate />
                  </div>
                  <div className="content">
                    <h4>Exclusive Designs</h4>
                    <p>Unique pieces you won't find anywhere else, each with its own story.</p>
                  </div>
                </BenefitItem>
                
                <BenefitItem>
                  <div className="icon">
                    <FaBoxOpen />
                  </div>
                  <div className="content">
                    <h4>Safe & Eco Packaging</h4>
                    <p>Sustainably packaged to ensure your items arrive safely and beautifully.</p>
                  </div>
                </BenefitItem>
              </WhyBuyGrid>
            </WhyBuyContainer>
          </ImageGallery>

          {/* Product Info */}
          <ProductInfo>
            <Title>{productData.name}</Title>
            
            {/* Stock Status */}
            {productData.stock !== undefined && (
              <StockStatus 
                className={
                  productData.stock === 0 
                    ? 'out-of-stock' 
                    : productData.stock <= 5 
                      ? 'low-stock' 
                      : 'in-stock'
                }
              >
                <span className="stock-icon">
                  {productData.stock === 0 
                    ? <FaBell /> 
                    : productData.stock <= 5 
                      ? <FaBolt /> 
                      : <FaBoxOpen />
                  }
                </span>
                {productData.stock === 0 
                  ? 'Out of Stock' 
                  : productData.stock <= 5 
                    ? `Only ${productData.stock} left in stock!` 
                    : 'In Stock'}
              </StockStatus>
            )}

            {/* Price */}
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {productData.discount > 0 ? (
                <>
                  <span style={{
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: 'var(--primary)',
                    marginRight: '0.5rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    ₹{(productData.price * (1 - (productData.discount / 100))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span style={{
                    color: '#888',
                    textDecoration: 'line-through',
                    opacity: 0.8,
                    marginRight: '0.5rem',
                    fontSize: '1.1rem'
                  }}>
                    ₹{productData.price?.toLocaleString('en-IN')}
                  </span>
                  <Chip
                    label={`${productData.discount}% OFF`}
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
                <span style={{
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  lineHeight: 1.2,
                  color: 'var(--primary)',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  ₹{productData.price?.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.15rem' }}>
                {renderStars(productData.rating)}
              </div>
              <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                {productData.rating} ({productData.reviewCount} reviews)
              </span>
            </div>
            
            {/* Category */}
            {category && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                margin: '0.5rem 0 1.5rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #f0f0f0',
                borderTop: '1px solid #f0f0f0',
                fontSize: '0.9rem'
              }}>
                <span>Category:</span>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f8f4e9',
                  color: '#8B5E3C',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textTransform: 'capitalize',
                  border: '1px solid #e8e0d0'
                }}>
                  {category}
                </span>
              </div>
            )}
            
            {/* Quantity Selector */}
            <QuantitySelector>
              <div className="label">Quantity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: quantity <= 1 ? 0.5 : 1,
                      padding: 0,
                      transition: 'all 0.2s ease',
                      ':hover:not(:disabled)': {
                        background: '#f5f5f5',
                        transform: 'scale(1.1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        color: '#000',
                      },
                      ':active:not(:disabled)': {
                        transform: 'scale(0.95)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <FaMinus color="#000" />
                  </button>
                  <div className="quantity" style={{
                    minWidth: '40px',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>{quantity}</div>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                      opacity: quantity >= 10 ? 0.5 : 1,
                      padding: 0,
                      transition: 'all 0.2s ease',
                      ':hover:not(:disabled)': {
                        background: '#f5f5f5',
                        transform: 'scale(1.1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        color: '#000',
                      },
                      ':active:not(:disabled)': {
                        transform: 'scale(0.95)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        color: '#000',
                      }
                    }}
                  >
                    <FaPlus color="#000" />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  <IconButton
                    className={isWishlisted ? 'active' : ''}
                    onClick={toggleWishlist}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaHeart />
                  </IconButton>
                  <IconButton
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaShare />
                  </IconButton>
                </div>
              </div>
            </QuantitySelector>

            {/* Action Buttons */}
            <ActionButtons>
              {productData.inStock ? (
                <>
                  <PrimaryButton
                    onClick={handleAddToCart}
                    disabled={productData.stock === 0 || isAddingToCart}
                    style={{ 
                      gridArea: 'addToCart',
                      background: productData.stock === 0 ? '#e0e0e0' : 'var(--primary)',
                      cursor: productData.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.8rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      ':hover:not(:disabled)': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      ':active:not(:disabled)': {
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }
                    }}
                    whileHover={productData.stock > 0 && !isAddingToCart ? { scale: 1.02 } : {}}
                    whileTap={productData.stock > 0 && !isAddingToCart ? { scale: 0.98 } : {}}
                    initial={false}
                    animate={{
                      scale: isAddingToCart ? 0.98 : 1,
                      opacity: isAddingToCart ? 0.8 : 1,
                      transition: { duration: 0.2 }
                    }}
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : productData.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <FaShoppingCart /> Add to Cart
                      </>
                    )}
                  </PrimaryButton>

                  <BuyNowButton
                    onClick={handleBuyNow}
                    className={isLoading ? 'loading' : ''}
                    disabled={isLoading || productData.stock === 0}
                    style={{ 
                      gridArea: 'buyNow',
                      opacity: productData.stock === 0 ? 0.7 : 1,
                      cursor: productData.stock === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <FaBolt className="bolt-icon" />
                    <span className="button-text">Buy Now</span>
                    <div className="spinner"></div>
                  </BuyNowButton>

                  <Button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCustomizationForm(true)}
                    style={{ gridArea: 'customize' }}
                    disabled={!productData.inStock}
                  >
                    <FaPalette /> Customize
                  </Button>
                  
                  {addToCartError && (
                    <div style={{ 
                      color: '#dc3545', 
                      marginTop: '0.5rem',
                      fontSize: '0.9rem',
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      animation: `${fadeIn} 0.3s ease-out`
                    }}>
                      {addToCartError}
                    </div>
                  )}
                </>
              ) : (
                <Button 
                  onClick={handleWaitlistClick}
                  style={{ backgroundColor: '#8B5E3C' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaClock style={{ marginRight: '8px' }} /> I need this product
                </Button>
              )}
            </ActionButtons>

            {/* Product Assurance Information */}
            <ProductAssuranceInfo />

            {/* Enhanced Description with Read More */}
            <div style={{
              width: '100%',
              margin: '1.5rem auto',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <h3 style={{
                  margin: '0 0 0.75rem 0',
                  color: '#333',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}>
                  Description
                </h3>
              </div>
              <div style={{
                padding: '1.25rem',
                position: 'relative',
                maxHeight: productData.description && productData.description.length > 650 && !isDescriptionExpanded ? '200px' : 'none',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease-in-out'
              }}>
                <div style={{
                  color: '#555',
                  lineHeight: '1.7',
                  fontSize: '0.95rem',
                  position: 'relative',
                  paddingRight: '1rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {productData.description}
                  {productData.description && productData.description.length > 650 && !isDescriptionExpanded && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: '1rem',
                      height: '40px',
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%)',
                      pointerEvents: 'none',
                      transition: 'opacity 0.3s ease'
                    }} />
                  )}
                </div>
              </div>
              {productData.description && productData.description.length > 650 && (
                <div style={{
                  padding: '0.75rem 1.25rem',
                  textAlign: 'center',
                  borderTop: '1px solid #f0f0f0',
                  backgroundColor: '#fff'
                }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsDescriptionExpanded(!isDescriptionExpanded);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        backgroundColor: 'rgba(139, 94, 60, 0.05)'
                      }
                    }}
                  >
                    {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transition: 'transform 0.3s ease',
                        transform: isDescriptionExpanded ? 'rotate(180deg)' : 'rotate(0)'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Product Dimensions and Weight */}
            <DimensionsSection>
              <DimensionsHeader>
                <DimensionsTitle>Product Details</DimensionsTitle>
                <UnitToggle>
                  <UnitButton
                    $active={isMetric}
                    onClick={() => setIsMetric(true)}
                  >
                    CM
                  </UnitButton>
                  <UnitButton
                    $active={!isMetric}
                    onClick={() => setIsMetric(false)}
                  >
                    IN
                  </UnitButton>
                </UnitToggle>
              </DimensionsHeader>
              <DimensionsContent>
                <DimensionRow>
                  <DimensionLabel>Dimensions</DimensionLabel>
                  <DimensionValue>
                    {productData.dimensions
                      ? isMetric
                        ? `${productData.dimensions.widthCm || 0} × ${productData.dimensions.heightCm || 0} × ${productData.dimensions.depthCm || 0} cm`
                        : `${productData.dimensions.widthInches || 0} × ${productData.dimensions.heightInches || 0} × ${productData.dimensions.depthInches || 0} in`
                      : 'N/A'}
                  </DimensionValue>
                </DimensionRow>
                <DimensionRow>
                  <DimensionLabel>Weight</DimensionLabel>
                  <DimensionValue>
                    {productData.weight ? `${productData.weight} kg` : 'N/A'}
                  </DimensionValue>
                </DimensionRow>
                {productData.material && (
                  <DimensionRow>
                    <DimensionLabel>Material</DimensionLabel>
                    <DimensionValue>{productData.material}</DimensionValue>
                  </DimensionRow>
                )}
                {productData.rodCut && (
                  <DimensionRow>
                    <DimensionLabel>Rod Cut</DimensionLabel>
                    <DimensionValue>{productData.rodCut}</DimensionValue>
                  </DimensionRow>
                )}
              </DimensionsContent>
            </DimensionsSection>

            {/* Impressive Text Sections */}
            <div style={{
              marginTop: '3rem',
              width: '100%',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {productData.section1 && productData.section1.title && (
                <div style={{
                  background: productData.section1.background || 'linear-gradient(135deg, #f9f5f0, #f0e6d9)',
                  borderRadius: '12px',
                  padding: '2.5rem',
                  marginBottom: '1.5rem',
                  color: productData.section1.textColor || '#3a2e1f',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: 'inherit'
                  }}>
                    {productData.section1.title}
                  </h3>
                  <p style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.7,
                    margin: 0,
                    color: 'inherit',
                    opacity: 0.95
                  }}>
                    {productData.section1.content}
                  </p>
                </div>
              )}

              {productData.section2 && productData.section2.title && (
                <div style={{
                  background: productData.section2.background || 'linear-gradient(135deg, #f0f5f0, #e6e9e0)',
                  borderRadius: '12px',
                  padding: '2.5rem',
                  color: productData.section2.textColor || '#1f3a2e',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: 'inherit'
                  }}>
                    {productData.section2.title}
                  </h3>
                  <p style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.7,
                    margin: 0,
                    color: 'inherit',
                    opacity: 0.95
                  }}>
                    {productData.section2.content}
                  </p>
                </div>
              )}
            </div>

            {/* Impressive Text Sections */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              marginTop: '3rem',
              width: '100%'
            }}>
              {productData.section1 && productData.section1.title && (
                <div style={{
                  background: productData.section1.background || 'linear-gradient(135deg, #f9f5f0, #f0e6d9)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'left',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    color: productData.section1.textColor || '#3a2e1f',
                    marginBottom: '1rem',
                    lineHeight: '1.3',
                    fontWeight: '600',
                    fontFamily: 'var(--font-heading, serif)'
                  }}>
                    {productData.section1.title}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: productData.section1.textColor || '#5a4a3a',
                    lineHeight: '1.7',
                    margin: 0
                  }}>
                    {productData.section1.content}
                  </p>
                </div>
              )}

              {productData.section2 && productData.section2.title && (
                <div style={{
                  background: productData.section2.background || 'linear-gradient(135deg, #f0f5f0, #e6e9e0)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'left',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    color: productData.section2.textColor || '#1f3a2e',
                    marginBottom: '1rem',
                    lineHeight: '1.3',
                    fontWeight: '600',
                    fontFamily: 'var(--font-heading, serif)'
                  }}>
                    {productData.section2.title}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: productData.section2.textColor || '#3a5a4a',
                    lineHeight: '1.7',
                    margin: 0
                  }}>
                    {productData.section2.content}
                  </p>
                </div>
              )}
            </div>
          </ProductInfo>
        </ProductGrid>
        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          product={productData}
        />
        {showCustomizationForm && (
          <CustomizationForm
            product={productData}
            onClose={() => setShowCustomizationForm(false)}
          />
        )}

        {/* Waitlist Modal */}
        {showWaitlistForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowWaitlistForm(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                &times;
              </button>
              
              <h2 style={{
                marginTop: 0,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaClock /> Join Waitlist
              </h2>
              
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                We'll notify you when this product is back in stock.
              </p>
              
              <form onSubmit={handleWaitlistSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#444'
                  }}>
                    Product
                  </label>
                  <input
                    type="text"
                    value={productData.name}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: '#f9f9f9',
                      color: '#666',
                      marginBottom: '1.5rem'
                    }}
                  />
                </div>
                
                {/* Name Field */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#444'
                  }}>
                    Your Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    readOnly={isNameReadOnly}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: isNameReadOnly ? '#f9f9f9' : 'white',
                      color: isNameReadOnly ? '#666' : 'inherit',
                      cursor: isNameReadOnly ? 'not-allowed' : 'text'
                    }}
                    placeholder={isNameReadOnly ? '' : 'Enter your name'}
                  />
                </div>
                
                {/* Email Field */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#444'
                  }}>
                    Email Address <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: currentUser?.email ? '#f9f9f9' : 'white',
                      color: currentUser?.email ? '#666' : 'inherit'
                    }}
                    readOnly={!!currentUser?.email}
                    placeholder="Enter your email"
                  />
                </div>
                
                {/* Phone Number Field */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#444'
                  }}>
                    Phone Number <span style={{ color: 'red' }}>*</span>
                    <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>(10 digits, no spaces or special characters)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    readOnly={isPhoneReadOnly}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: isPhoneReadOnly ? '#f9f9f9' : 'white',
                      color: isPhoneReadOnly ? '#666' : 'inherit',
                      cursor: isPhoneReadOnly ? 'not-allowed' : 'text'
                    }}
                    pattern="[0-9]{10}"
                    title={isPhoneReadOnly ? 'Saved phone number' : 'Please enter a 10-digit phone number'}
                    placeholder={isPhoneReadOnly ? '' : 'Enter your 10-digit phone number'}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  marginTop: '2rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistForm(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f5f5f5',
                      color: '#333',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s'
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#8B5E3C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Me to Waitlist'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Related Products Section */}
        <div style={{ marginTop: '4rem' }}>
          {productData ? (
            <RelatedProducts
              currentProductId={productData.id}
              category={productData.category || 'decor'}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>Loading related products...</h3>
            </div>
          )}
        </div>
      </Container>
      {/* Zoom Modal */}
      <ZoomModal
        isOpen={isZoomModalOpen}
        onClose={closeZoomModal}
        imageUrl={(() => {
          const image = productData?.images?.[currentImageIndex];
          if (!image) return '';
          return typeof image === 'string' ? image : image.url || image.src || '';
        })()}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        altText={productData?.name || 'Product'}
        maxZoom={5}
        minZoom={1}
      />
  <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    </>
  );
};

export default TerracottaProductDetail;
