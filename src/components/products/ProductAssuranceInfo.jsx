import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FaTruck, FaHandsHelping, FaLeaf, FaShieldAlt, FaAward } from 'react-icons/fa';
import { GiClayBrick } from 'react-icons/gi';

// Helper function to add days (including weekends)
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Format date to "Month Day" format (e.g., "Jan 1")
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const AssuranceContainer = styled.div`
  background: #f9f5f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0e6d9;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  color: #5D4037;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
`;

const AssuranceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const AssuranceItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
`;

const IconWrapper = styled.span`
  color: #8B5E3C;
  font-size: 1.25rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
`;

const HighlightedText = styled.span`
  color: var(--primary);
  font-weight: 600;
`;

const TextContent = styled.div`
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
    line-height: 1.4;
  }
`;

const ProductAssuranceInfo = () => {
  // Calculate delivery dates (7-10 days from today, including weekends)
  const { minDeliveryDate, maxDeliveryDate } = useMemo(() => {
    const today = new Date();
    return {
      minDeliveryDate: addDays(today, 7),
      maxDeliveryDate: addDays(today, 10)
    };
  }, []);

  const deliveryMessage = (
    <span>
      Expected delivery by{' '}
      <HighlightedText>
        {formatDate(minDeliveryDate)} - {formatDate(maxDeliveryDate)}
      </HighlightedText>
    </span>
  );

  const assuranceItems = [
    {
      icon: <FaTruck />,
      title: "Fast Shipping",
      description: deliveryMessage
    },
    {
      icon: <FaHandsHelping />,
      title: "100% Handcrafted",
      description: "Each piece is carefully made by skilled artisans"
    },
    {
      icon: <FaLeaf />,
      title: "100% Organic",
      description: "Made with natural, eco-friendly materials"
    },
    {
      icon: <FaShieldAlt />,
      title: "Quality Assured",
      description: "Rigorous quality checks ensure perfection"
    },
    {
      icon: <FaAward />,
      title: "Authentic Craftsmanship",
      description: "Supporting traditional artisans and their heritage"
    },
    {
      icon: <GiClayBrick />,
      title: "Pure Materials",
      description: "Made with 100% natural clay, no artificial additives"
    }
  ];

  return (
    <AssuranceContainer>
      <Title>Our Promise to You</Title>
      <AssuranceList>
        {assuranceItems.map((item, index) => (
          <AssuranceItem key={index}>
            <IconWrapper>{item.icon}</IconWrapper>
            <TextContent>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </TextContent>
          </AssuranceItem>
        ))}
      </AssuranceList>
    </AssuranceContainer>
  );
};

export default ProductAssuranceInfo;
