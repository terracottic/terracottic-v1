# Terracottic E-commerce Platform - Technical Documentation

## Overview
Terracottic is an e-commerce platform specializing in handcrafted terracotta products. This document provides a comprehensive overview of the technologies, architecture, and features implemented in the project.

## Technology Stack

### Frontend
- **React.js** - JavaScript library for building user interfaces
- **Material-UI (MUI)** - React UI component library for consistent design
- **React Router** - Client-side routing
- **Redux/Context API** - State management
- **Firebase SDK** - For authentication and real-time database

### Backend (Firebase)
- **Firebase Authentication** - User authentication and management
- **Firestore Database** - NoSQL database for storing application data
- **Cloud Functions** - Serverless backend functions
- **Firebase Hosting** - Web application hosting

### Development Tools
- **Node.js** - JavaScript runtime
- **npm/yarn** - Package management
- **Git** - Version control
- **ESLint/Prettier** - Code linting and formatting

## Project Structure

```
src/
├── assets/           # Static assets (images, icons, etc.)
├── components/       # Reusable UI components
├── config/          # Configuration files
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── pages/           # Page components
│   ├── admin/       # Admin panel pages
│   ├── auth/        # Authentication pages
│   └── shop/        # Customer-facing pages
├── services/        # API and service integrations
├── styles/          # Global styles and themes
└── utils/           # Utility functions and helpers
```

## Key Features

### Admin Panel
- Order management
- Product catalog management
- User management
- Sales and analytics dashboard
- Invoice generation

### Customer Features
- User authentication (signup/login)
- Product browsing and search
- Shopping cart
- Checkout process
- Order tracking
- User profile management

### Order Processing
- Multi-step checkout
- Order confirmation emails
- Order status tracking
- Invoice generation with QR codes
- Print functionality

## Authentication Flow
1. User signs up/signs in using Firebase Authentication
2. JWT tokens are stored securely in the browser
3. Protected routes verify authentication status
4. User roles (admin/customer) determine access levels

## Data Models

### Users
- Basic info (name, email, etc.)
- Authentication details
- Role (admin/customer)
- Address book
- Order history

### Products
- Product details (name, description, price)
- Categories and tags
- Inventory management
- Image URLs

### Orders
- Order details (ID, date, status)
- Customer information
- Shipping/billing addresses
- Items with quantities and prices
- Payment information
- Order history

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install` or `yarn`
3. Set up Firebase project and add configuration
4. Start development server: `npm start` or `yarn start`
5. Build for production: `npm run build` or `yarn build`

## Deployment

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init`
4. Deploy: `firebase deploy`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - Get user's orders (admin gets all orders)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (admin only)

## Error Handling
- All API errors return a consistent error format
- Client-side validation for forms
- Global error boundary for React components

## Security Considerations
- Input validation on both client and server
- Protected routes for admin features
- Secure storage of sensitive data
- Rate limiting on authentication endpoints
- CORS configuration

## Performance Optimization
- Code splitting with React.lazy and Suspense
- Image optimization
- Memoization for expensive calculations
- Efficient Firestore queries with indexes

## Testing
- Unit tests with Jest and React Testing Library
- Integration tests for critical user flows
- End-to-end tests with Cypress

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License
[Specify your license here]

## Contactlo
For support, email support@terracottic.com
