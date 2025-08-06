import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaFacebook, FaWhatsapp, FaTelegram, 
  FaPinterest, FaRegCopy, FaCheck, FaLink, FaShareAlt 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import styled, { keyframes } from 'styled-components';
import 'react-toastify/dist/ReactToastify.css';

// Floating animation
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(145deg, #ffffff, #f8f8f8);
  border-radius: 20px;
  padding: 32px 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: ${float} 8s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #8B5E3C, #D4A76A, #8B5E3C);
  }
`;

const ShareHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: #2c3e50;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #8B5E3C, #D4A76A);
      border-radius: 3px;
    }
  }
  
  p {
    margin: 8px 0 0;
    color: #7f8c8d;
    font-size: 0.95rem;
  }
  
  button {
    position: absolute;
    top: -10px;
    right: -10px;
    background: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    color: #e74c3c; /* Changed to red color */
    
    &:hover {
      transform: rotate(90deg);
      color: #c0392b; /* Darker red on hover */
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      background: #fff5f5; /* Light red background on hover */
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const ShareOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 20px;
  margin: 30px 0;
`;

const ShareButton = styled(motion.button).attrs(() => ({
  whileHover: { y: -5, scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
}))`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border: none;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  svg {
    font-size: 28px;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }
  
  span {
    font-size: 13px;
    font-weight: 600;
    color: #2c3e50;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.3s ease;
  }
  
  &:hover::after {
    transform: scaleX(1);
  }
  
  /* Platform-specific styles */
  &.facebook { 
    color: #1877F2;
    &::after { background: linear-gradient(90deg, #1877F2, #34A1F2); }
  }
  
  &.whatsapp { 
    color: #25D366;
    &::after { background: linear-gradient(90deg, #25D366, #128C7E); }
  }
  
  &.telegram { 
    color: #0088cc;
    &::after { background: linear-gradient(90deg, #0088cc, #34A7E5); }
  }
  
  &.pinterest { 
    color: #E60023;
    &::after { background: linear-gradient(90deg, #E60023, #F28B82); }
  }
  
  &.copy { 
    color: #8B5E3C;
    &::after { background: linear-gradient(90deg, #8B5E3C, #D4A76A); }
  }
`;

const CopyLink = styled.div`
  position: relative;
  margin-top: 30px;
  
  &::before {
    content: 'Or copy the link';
    display: block;
    text-align: center;
    color: #7f8c8d;
    font-size: 0.9rem;
    margin-bottom: 12px;
    position: relative;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 30%;
      height: 1px;
      background: linear-gradient(90deg, transparent, #ddd);
    }
    
    &::before { left: 0; }
    &::after { right: 0; background: linear-gradient(90deg, #ddd, transparent); }
  }
  
  .input-group {
    display: flex;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid #eee;
    
    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }
    
    &:focus-within {
      border-color: #8B5E3C;
      box-shadow: 0 8px 25px rgba(139, 94, 60, 0.15);
    }
    
    input {
      flex: 1;
      padding: 14px 18px;
      border: none;
      font-size: 14px;
      color: #2c3e50;
      background: transparent;
      
      &::placeholder {
        color: #95a5a6;
      }
      
      &:focus {
        outline: none;
      }
    }
    
    button {
      padding: 0 20px;
      background: linear-gradient(135deg, #8B5E3C, #D4A76A);
      color: white;
      border: none;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover::before {
        opacity: 1;
      }
      
      &:active {
        transform: translateY(1px);
      }
      
      &.copied {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        padding: 0 16px;
        
        &::before {
          display: none;
        }
      }
    }
  }
`;

const ShareModal = ({ isOpen, onClose, product = {} }) => {
  const [isCopied, setIsCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const title = product?.name || 'Check out this amazing product';
  const inputRef = useRef(null);
  
  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { opacity: 0 }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };
  const shareText = `${title} - ${currentUrl}`;
  
  const shareOnSocial = (platform) => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(shareText);
    
    const socialUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`
    };

    if (socialUrls[platform]) {
      const width = 600;
      const height = 500;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      window.open(
        socialUrls[platform],
        'Share',
        `width=${width},height=${height},top=${top},left=${left},toolbar=0,location=0,menubar=0,status=0`
      );
    }
  };

  const copyToClipboard = async () => {
    if (!inputRef.current) return;
    
    try {
      inputRef.current.select();
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      
      toast.success('Link copied to clipboard!', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        style: {
          background: '#2ecc71',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 500
        }
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        style: {
          background: '#e74c3c',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 500
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <ModalContent
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 300,
            delay: 0.1
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ShareHeader>
            <h3>Share This Product</h3>
            <p>Spread the word about this amazing product</p>
            <button 
              onClick={onClose} 
              aria-label="Close share modal"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: '10px',
                right: '10px',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
            >
              <FaTimes style={{ 
                color: '#e74c3c',
                fontSize: '20px',
                transition: 'all 0.2s ease'
              }} />
            </button>
          </ShareHeader>
          
          <motion.div 
            className="share-options-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <ShareOptions>
              <motion.div variants={itemVariants}>
                <ShareButton 
                  className="facebook"
                  onClick={() => shareOnSocial('facebook')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaFacebook />
                  <span>Facebook</span>
                </ShareButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <ShareButton 
                  className="whatsapp"
                  onClick={() => shareOnSocial('whatsapp')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </ShareButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <ShareButton 
                  className="telegram"
                  onClick={() => shareOnSocial('telegram')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaTelegram />
                  <span>Telegram</span>
                </ShareButton>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <ShareButton 
                  className="pinterest"
                  onClick={() => shareOnSocial('pinterest')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaPinterest />
                  <span>Pinterest</span>
                </ShareButton>
              </motion.div>
            </ShareOptions>
            
            <motion.div variants={itemVariants} style={{ width: '100%' }}>
              <CopyLink>
                <div className="input-group">
                  <input 
                    type="text" 
                    ref={inputRef}
                    value={currentUrl} 
                    readOnly 
                    onClick={(e) => e.target.select()}
                    aria-label="Shareable link"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className={isCopied ? 'copied' : ''}
                    disabled={isCopied}
                  >
                    {isCopied ? (
                      <>
                        <FaCheck />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FaRegCopy />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </CopyLink>
            </motion.div>
          </motion.div>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};

export default ShareModal;
