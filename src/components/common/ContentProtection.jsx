import { useEffect } from 'react';

const ContentProtection = () => {
  useEffect(() => {
    // Disable right-click to prevent image saving
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable drag and drop for images
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Customize copy behavior
    const handleCopy = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        e.preventDefault();
        return false;
      }
      
      // Only allow copying links
      const selectedText = selection.toString();
      const isLink = /^https?:\/\//.test(selectedText.trim());
      
      if (!isLink) {
        e.clipboardData.setData('text/plain', 'This content is protected.');
        e.preventDefault();
        return false;
      }
    };

    // Disable keyboard shortcuts for developer tools
    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add CSS to prevent text selection and image dragging
  const style = `
    img {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
      pointer-events: none;
    }
    
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    a, input, textarea, [contenteditable] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;

  return <style>{style}</style>;
};

export default ContentProtection;
