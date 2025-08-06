// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
// // import * as ImageKit from 'imagekit';

// // Initialize Firebase Admin
// admin.initializeApp();

// // Initialize ImageKit
// const imagekit = new ImageKit({
//   publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
//   privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
//   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
// });

// /**
//  * Get authentication parameters for client-side upload
//  */
// export const getAuthParams = functions.https.onRequest(async (req, res) => {
//   try {
//     // Verify the request is from an authenticated user
//     if (!req.headers.authorization) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     // Verify the Firebase ID token
//     const idToken = req.headers.authorization.split('Bearer ')[1];
//     await admin.auth().verifyIdToken(idToken);

//     // Generate and return auth parameters
//     const authParams = imagekit.getAuthenticationParameters();
//     res.json(authParams);
//   } catch (error) {
//     console.error('Error generating auth parameters:', error);
//     res.status(500).json({ error: 'Failed to generate authentication parameters' });
//   }
// });

// /**
//  * Delete a file from ImageKit
//  */
// export const deleteFile = functions.https.onRequest(async (req, res) => {
//   try {
//     // Verify the request is from an authenticated admin
//     if (!req.headers.authorization) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     // Verify the Firebase ID token and check if user is admin
//     const idToken = req.headers.authorization.split('Bearer ')[1];
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     const user = await admin.auth().getUser(decodedToken.uid);
    
//     if (!user.customClaims?.admin) {
//       return res.status(403).json({ error: 'Forbidden: Admin access required' });
//     }

//     // Get file ID from request body
//     const { fileId } = req.body;
//     if (!fileId) {
//       return res.status(400).json({ error: 'File ID is required' });
//     }

//     // Delete the file
//     await imagekit.deleteFile(fileId);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({ error: 'Failed to delete file' });
//   }
// });
