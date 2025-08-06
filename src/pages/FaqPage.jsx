import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const FaqPage = () => {
  const [expanded, setExpanded] = useState('panel1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      id: 'panel1',
      question: 'How do I place an order?',
      answer: 'You can place an order directly through our website by adding items to your cart and proceeding to checkout. Create an account or check out as a guest, enter your shipping details, choose a payment method, and confirm your order.'
    },
    {
      id: 'panel2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI payments, net banking, and popular digital wallets. All payments are processed through secure payment gateways to ensure your financial information is protected.'
    },
    {
      id: 'panel3',
      question: 'How long does shipping take?',
      answer: 'We process orders within 1-2 business days. Delivery times vary by location: 3-5 business days for metro cities, 5-7 business days for other locations, and 7-10 business days for remote areas. You will receive a tracking number once your order ships.'
    },
    {
      id: 'panel4',
      question: 'Do you offer international shipping?',
      answer: 'Currently, we only ship within India. We plan to expand our international shipping options in the near future. Please check back later or sign up for our newsletter to stay updated.'
    },
    {
      id: 'panel5',
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy from the date of delivery. Items must be in their original condition with all tags attached. Please contact our customer support to initiate a return. Note that customized or personalized items may not be eligible for returns.'
    },
    {
      id: 'panel6',
      question: 'How do I care for my terracotta products?',
      answer: 'Before first use, soak new terracotta items in water for 24 hours. Hand wash with mild detergent and avoid using harsh chemicals or abrasive scrubbers. Allow to dry completely before storing. For cookware, season with oil before first use as per the instructions provided.'
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <HelpOutlineIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Frequently Asked Questions
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {faqs.map((faq) => (
            <Accordion 
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleChange(faq.id)}
              elevation={2}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${faq.id}-content`}
                id={`${faq.id}-header`}
              >
                <Typography variant="subtitle1" fontWeight={500}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Still have questions?
          </Typography>
          <Typography variant="body1">
            Contact our support team at <strong>terracottic@gmail.com</strong> or call us at <strong>+91 9732029858</strong>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default FaqPage;
