const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateUserRole = functions.https.onCall(async (data, context) => {
  // Verify the request is authenticated and from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    // Verify the user is an admin
    const adminUser = await admin.auth().getUser(context.auth.uid);
    if (!adminUser.customClaims || adminUser.customClaims.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can update roles'
      );
    }

    // Update custom claims
    await admin.auth().setCustomUserClaims(data.uid, {
      role: data.role
    });

    // Update Firestore
    await admin.firestore().collection('users').doc(data.uid).update({
      role: data.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    throw new functions.https.HttpsError('internal', 'Error updating role');
  }
});
