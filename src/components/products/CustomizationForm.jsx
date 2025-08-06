import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiSend, 
  FiX, 
  FiCheck, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiGlobe, 
  FiMessageSquare, 
  FiLoader 
} from 'react-icons/fi';

// Keyframe animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
  100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 480px) {
    padding: 0.5rem;
    align-items: flex-start;
  }
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  padding: 2rem;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: none;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  position: relative;
  border: 1px solid rgba(168, 85, 247, 0.1);
  animation: ${slideIn} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
  transition: all 0.3s ease;
  margin: 1rem 0;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    max-height: 85vh;
    margin: 0.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 1.25rem 1rem;
    border-radius: 16px;
    max-height: 95vh;
    margin: 0.5rem 0.25rem;
  }
  

`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1) rotate(90deg);
    color: white;
  }
  
  svg {
    width: 22px;
    height: 22px;
    stroke-width: 3;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 0.5rem;
  
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
  opacity: 0;
  animation: ${slideIn} 0.4s ease-out forwards;
  animation-delay: ${props => props.delay || '0.1s'};
  
  &:focus-within label {
    color: #a855f7;
    transform: translateY(-2px);
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-left: 0.35rem;
  }
`;

const inputStyles = css`
  width: 100%;
  padding: 0.9rem 1.2rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.25s ease;
  background: #fff;
  color: #343a40;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  -webkit-appearance: none;
  
  @media (max-width: 480px) {
    padding: 0.8rem 1rem;
    font-size: 0.95rem;
    border-radius: 10px;
  }
  
  &::placeholder {
    color: #adb5bd;
    font-weight: 400;
    font-size: 0.95em;
  }
  
  &:focus {
    outline: none;
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
    transform: translateY(-1px);
  }
  
  &:hover:not(:focus) {
    border-color: #ced4da;
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const TextArea = styled.textarea`
  ${inputStyles}
  min-height: 120px;
  resize: vertical;
  line-height: 1.6;
  font-family: inherit;
`;

const Select = styled.select`
  ${inputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2em;
  padding-right: 2.5rem;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #8b5e3c, #a87c5b);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(139, 94, 60, 0.3);
    
    &::after {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
  }
  
  &:disabled {
    background: #e9ecef;
    color: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const CustomizationForm = ({ product, onClose }) => {
  const { currentUser } = useAuth();
  const formRef = useRef(null);
  
  // Create a custom X icon component with explicit styling
  const XIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
    language: 'English',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsSubmitting(true);
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
      }));
    }

    // Add animation delay to form groups after component mounts
    if (formRef.current) {
      const formGroups = formRef.current.querySelectorAll(FormGroup);
      formGroups.forEach((group, index) => {
        group.style.animationDelay = `${0.1 + index * 0.1}s`;
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Extract product ID from URL or use the one from props
      const productId = product?.id || 'N/A';
      const productName = product?.name || 'Product';
      
      // Prepare the message for WhatsApp in the requested format
      const message = 
      `*Customization Request*\n\n` +
      `*Product:* ${product?.name || 'N/A'}\n` +
      `*Product ID:* ${productId}\n\n` +
      `*Customer Details*\n` +
      `*Name:* ${formData.name}\n` +
      `*Email:* ${formData.email}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Address:* ${formData.address}\n` +
      `*Preferred Language:* ${formData.language}\n\n` +
      `*Customization Details:*\n${formData.message || 'No additional details provided.'}`;

      // Open WhatsApp in a new tab with the message
      const whatsappUrl = `https://wa.me/917001018847?text=${encodeURIComponent(message)}`;
      const newWindow = window.open(whatsappUrl, '_blank');
      
      // Focus the new window
      if (newWindow) {
        newWindow.focus();
      }
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spin animation for the loader
  const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;

  const SpinIcon = styled(FiLoader)`
    animation: ${spin} 1s linear infinite;
    margin-right: 8px;
  `;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} ref={formRef}>
        <CloseButton onClick={onClose}><XIcon /></CloseButton>
        
        {isSuccess ? (
          <SuccessMessage>
            <FiCheck />
            <h3>Request Sent Successfully!</h3>
            <p>Redirecting you to WhatsApp to send your customization request...</p>
          </SuccessMessage>
        ) : (
          <>
            <h2 style={{ marginTop: 0, color: '#A86FA4', marginBottom: '1rem', fontSize: '1.75rem' }}>
              Request Customization
            </h2>
            
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Fill in the details below and we'll get back to you shortly with customization options for this product.
            </p>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup delay="0.1s">
                <Label><FiUser size={16} /> Full Name *</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  disabled={isSubmitting}
                />
              </FormGroup>
              
              <FormGroup delay="0.2s">
                <Label><FiMail size={16} /> Email Address *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  disabled={isSubmitting}
                />
              </FormGroup>
              
              <FormGroup delay="0.3s">
                <Label><FiPhone size={16} /> Phone Number *</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  disabled={isSubmitting}
                />
              </FormGroup>
              
              <FormGroup delay="0.4s">
                <Label><FiMapPin size={16} /> Delivery Address *</Label>
                <TextArea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your complete delivery address"
                  required
                  disabled={isSubmitting}
                />
              </FormGroup>
              
              <FormGroup delay="0.5s">
                <Label><FiGlobe size={16} /> Preferred Language</Label>
                <Select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="English">English</option>
                  <option value="हिंदी">हिंदी</option>
                  <option value="தமிழ்">தமிழ்</option>
                  <option value="తెలుగు">తెలుగు</option>
                  <option value="मराठी">मराठी</option>
                  <option value="বাংলা">বাংলা</option>
                </Select>
              </FormGroup>
              
              <FormGroup delay="0.6s">
                <Label><FiMessageSquare size={16} /> Additional Message</Label>
                <TextArea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Any specific customization requirements or questions..."
                  disabled={isSubmitting}
                />
              </FormGroup>
              
              <SubmitButton 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <SpinIcon />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Send Request
                  </>
                )}
              </SubmitButton>
            </Form>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default CustomizationForm;
