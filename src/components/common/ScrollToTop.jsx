import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll to top when path changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Add click handler for manual scroll-to-top links
    const handleLinkClick = (e) => {
      // Check if the clicked element is a link or inside a link
      const link = e.target.closest('a');
      if (link) {
        // Only scroll if it's not an anchor link
        if (!link.getAttribute('href')?.startsWith('#')) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleLinkClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
