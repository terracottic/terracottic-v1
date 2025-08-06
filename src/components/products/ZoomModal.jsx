import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

// Styled Components
const ZoomBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1400;
  cursor: zoom-out;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
`;

const ZoomedImageContainer = styled(motion.div)`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
`;

const ZoomedImage = styled(motion.img)`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  touch-action: none;
  transform-origin: center center;
`;

const CloseButton = styled(IconButton)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 1500;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const ZoomControls = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 1500;
  color: white;
  font-size: 14px;
`;

const ZoomButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  margin: 0 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Main Component
const ZoomModal = ({ isOpen, onClose, imageUrl, maxZoom = 5, minZoom = 1 }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startTouch, setStartTouch] = useState(null);
  const [initialDistance, setInitialDistance] = useState(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY);
    const newScale = Math.min(Math.max(minZoom, scale + delta * 0.1), maxZoom);
    setScale(newScale);
  }, [scale, maxZoom, minZoom]);

  const handleMouseDown = useCallback((e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position, scale]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || scale <= 1) return;
    const x = e.clientX - startPos.x;
    const y = e.clientY - startPos.y;
    const maxX = (scale - 1) * 200;
    const maxY = (scale - 1) * 200;
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    });
  }, [isDragging, scale, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setInitialDistance(distance);
      setStartTouch({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      });
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setStartPos({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      if (initialDistance) {
        const newScale = Math.min(Math.max(minZoom, scale * (distance / initialDistance)), maxZoom);
        setScale(newScale);
      }
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      if (startTouch) {
        const deltaX = centerX - startTouch.x;
        const deltaY = centerY - startTouch.y;
        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        setStartTouch({ x: centerX, y: centerY });
      }
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      const x = touch.clientX - startPos.x;
      const y = touch.clientY - startPos.y;
      const maxX = (scale - 1) * 200;
      const maxY = (scale - 1) * 200;
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y))
      });
    }
  }, [initialDistance, scale, startTouch, startPos, maxZoom, minZoom]);

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    setStartTouch(null);
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);

  // Zoom controls
  const zoomStep = 0.1;
  const handleZoomIn = () => setScale(prev => Math.min(prev + zoomStep, maxZoom));
  const handleZoomOut = () => setScale(prev => Math.max(prev - zoomStep, minZoom));
  const zoomPercentage = Math.round(scale * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <ZoomBackdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          <ZoomedImageContainer
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <ZoomedImage
              src={imageUrl}
              alt="Zoomed"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-out'
              }}
              draggable={false}
            />
          </ZoomedImageContainer>

          <CloseButton onClick={onClose} ref={closeBtnRef} aria-label="Close zoom">
            <Close />
          </CloseButton>

          <ZoomControls onClick={(e) => e.stopPropagation()}>
            <ZoomButton onClick={handleZoomOut} disabled={scale <= minZoom}>−</ZoomButton>
            {zoomPercentage}%
            <ZoomButton onClick={handleZoomIn} disabled={scale >= maxZoom}>+</ZoomButton>
          </ZoomControls>
        </ZoomBackdrop>
      )}
    </AnimatePresence>
  );
};

export default ZoomModal;
