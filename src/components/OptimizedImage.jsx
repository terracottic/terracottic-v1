import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  ...props
}) => {
  const [isWebPSupported, setIsWebPSupported] = useState(false);
  const [isAvifSupported, setIsAvifSupported] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for WebP support
    const webPImg = new Image();
    webPImg.onload = webPImg.onerror = () => {
      setIsWebPSupported(webPImg.height === 2);
    };
    webPImg.src = 'data:image/webp;base64,UklGRi4AAABXRUJQVlA4TCEAAAAvAUAAEB8wAiMwAgSSNtse/cXjxyCCmrYNWPwmHRH9jwMA';

    // Check for AVIF support
    const avifImg = new Image();
    avifImg.onload = avifImg.onerror = () => {
      setIsAvifSupported(avifImg.width === 2);
    };
    avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEQAABAAEAAAABAAABGgAAAB0AAACNpZGF0AAAAAABoaXBycAAAABJpY3QAAAAAABhnaANmAAABZGF0YQAAAAEAAAAAEGRhdGEAAAABAAAAAExFQ0Q=';
  }, []);

  const getSrcSet = (basePath, ext) => {
    const fileName = basePath.replace(/\.[^/.]+$/, ''); // Remove extension
    return [
      `${fileName}_320w.${ext} 320w`,
      `${fileName}_480w.${ext} 480w`,
      `${fileName}_768w.${ext} 768w`,
      `${fileName}_1024w.${ext} 1024w`,
      `${fileName}_1366w.${ext} 1366w`,
      `${fileName}_1600w.${ext} 1600w`,
      `${fileName}_1920w.${ext} 1920w`,
    ].join(', ');
  };

  const basePath = src.replace(/\.[^/.]+$/, ''); // Remove extension
  const fallbackSrc = `${basePath}_optimized.jpg`;
  const webpSrcSet = getSrcSet(basePath, 'webp');
  const avifSrcSet = getSrcSet(basePath, 'avif');
  const jpgSrcSet = getSrcSet(basePath, 'jpg');

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
    >
      <picture>
        {isAvifSupported && (
          <source 
            type="image/avif" 
            srcSet={avifSrcSet}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        {isWebPSupported && (
          <source 
            type="image/webp" 
            srcSet={webpSrcSet}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <img
          src={fallbackSrc}
          srcSet={jpgSrcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={alt}
          loading={loading}
          width={width}
          height={height}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          {...props}
        />
      </picture>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  loading: PropTypes.oneOf(['eager', 'lazy']),
};

export default OptimizedImage;
