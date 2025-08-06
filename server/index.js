import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;
try {
    // Load service account from JSON file
    const serviceAccountPath = join(__dirname, 'config', 'firebase-service-account.json');
    const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key.replace(/\\n/g, '\n')
            })
        });
        console.log('Firebase Admin initialized successfully');
    }
    
    // Initialize Firestore
    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}


const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Verify Firebase ID Token
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authentication token provided'
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired authentication token'
        });
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Out of Stock Requests Endpoints - Simplified Version
// Only stores email, productId, and createdAt
app.get('/api/out-of-stock', authenticate, async (req, res) => {
    console.log('[OUT_OF_STOCK] Fetching out of stock subscriptions...');
    
    const sendError = (status, message) => {
        console.error(`[OUT_OF_STOCK_ERROR] ${message}`);
        return res.status(status).json({ 
            success: false, 
            error: message,
            timestamp: new Date().toISOString() 
        });
    };

    try {
        const outOfStockRef = db.collection('outOfStockRequests');
        const snapshot = await outOfStockRef
            .orderBy('createdAt', 'desc')
            .get()
            .catch(() => {
                console.log('[OUT_OF_STOCK] No collection exists yet');
                return { empty: true };
            });

        if (snapshot.empty) {
            return res.json({
                success: true,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            });
        }
        
        const requests = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Only include the essential fields
            requests.push({
                id: doc.id,
                email: data.email,
                productId: data.productId,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        });
        
        return res.json({
            success: true,
            data: requests,
            count: requests.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[OUT_OF_STOCK_ERROR]', error);
        return sendError(500, 'Failed to fetch out of stock subscriptions');
    }
});

app.post('/api/out-of-stock', async (req, res) => {
    try {
        const { productId, email } = req.body;
        
        if (!productId || !email) {
            return res.status(400).json({ 
                success: false,
                error: 'Product ID and email are required' 
            });
        }
        
        // Simple email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ 
                success: false,
                error: 'Please enter a valid email address' 
            });
        }
        
        const requestData = {
            productId,
            email: email.toLowerCase().trim(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Check if this email is already subscribed for this product
        const existing = await db.collection('outOfStockRequests')
            .where('productId', '==', productId)
            .where('email', '==', email.toLowerCase().trim())
            .limit(1)
            .get();
            
        if (!existing.empty) {
            return res.status(200).json({
                success: true,
                message: 'You are already subscribed for notifications about this product',
                alreadySubscribed: true
            });
        }
        
        const docRef = await db.collection('outOfStockRequests').add(requestData);
        
        res.status(201).json({
            success: true,
            id: docRef.id,
            ...requestData,
            createdAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error creating out of stock subscription:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to subscribe for notifications' 
        });
    }
});

app.patch('/api/out-of-stock/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        await db.collection('outOfStockRequests').doc(id).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

app.delete('/api/out-of-stock/:id', authenticate, async (req, res) => {
    try {
        await db.collection('outOfStockRequests').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});



// Get ImageKit authentication parameters
app.get('/api/imagekit/auth', authenticate, (req, res) => {
    try {
        // Get current timestamp for logging
        const now = new Date();

        // Log the authentication request
        console.log('Generating authentication parameters', {
            requestTime: now.toISOString(),
            note: 'No explicit expiration time set - using ImageKit default (1 hour)'
        });

        try {
            // Generate authentication parameters without explicit expiration
            // ImageKit will use its default expiration (1 hour)
            const authParams = imagekit.getAuthenticationParameters();

            // Log the generated parameters (safely, without exposing full values)
            const logParams = {
                ...authParams,
                token: authParams.token ? `${authParams.token.substring(0, 8)}...` : 'missing',
                signature: authParams.signature ? `${authParams.signature.substring(0, 8)}...` : 'missing',
                expire: authParams.expire || 'missing'
            };

            console.log('Successfully generated authentication parameters:', logParams);

            // Return the authentication parameters with basic debug info
            res.json({
                token: authParams.token,
                signature: authParams.signature,
                _debug: {
                    serverTime: now.toISOString(),
                    note: 'Using default ImageKit token expiration (1 hour)',
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (authError) {
            console.error('Error in getAuthenticationParameters:', {
                error: authError.message,
                stack: authError.stack,
                timestamp: new Date().toISOString(),
                note: 'Error occurred during authentication parameter generation'
            });
            throw new Error(`Failed to generate authentication parameters: ${authError.message}`);
        }
    } catch (error) {
        console.error('Error generating auth params:', {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString(),
            currentTime: Math.floor(Date.now() / 1000)
        });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate authentication parameters',
            details: error.message,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }
});

// Product Management Endpoints
const db = admin.firestore();

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const doc = await db.collection('products').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create or update product
app.post('/api/products', authenticate, async (req, res) => {
    try {
        const productData = req.body;
        const userId = req.user.uid;

        // Add timestamps
        const now = admin.firestore.FieldValue.serverTimestamp();
        productData.updatedAt = now;

        if (!productData.id) {
            // New product
            productData.createdAt = now;
            productData.createdBy = userId;
            const docRef = await db.collection('products').add(productData);
            return res.status(201).json({ id: docRef.id, ...productData });
        } else {
            // Update existing product
            const docRef = db.collection('products').doc(productData.id);
            await docRef.update(productData);
            const updatedDoc = await docRef.get();
            return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
        }
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ error: 'Failed to save product' });
    }
});

// Delete product
app.delete('/api/products/:id', authenticate, async (req, res) => {
    try {
        await db.collection('products').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Delete image from ImageKit
app.delete('/api/imagekit/delete/:fileId', authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;
        console.log(`Deleting file with ID: ${fileId}`);

        // First verify the user has permission to delete this file
        // (You might want to add additional checks here based on your app's requirements)

        await imagekit.deleteFile(fileId);
        console.log(`Successfully deleted file: ${fileId}`);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete file',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

export default app;
