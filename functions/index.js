import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize the Firebase Admin SDK
initializeApp();

const DATABASE_ID = "ai-studio-c3adc4b7-1bf1-4829-9e88-fddbf69d37cf";
const db = getFirestore(DATABASE_ID);

/**
 * Cloud Function: notifyAdminsOnIssueCreated
 * Trigger: Firestore onCreate on collection 'issues'
 * Responsibilities:
 * - Find every administrator from the users collection
 * - Create a notification document for each administrator in the notifications collection
 */
export const notifyAdminsOnIssueCreated = onDocumentCreated({
  document: "issues/{issueId}",
  database: DATABASE_ID
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with this event.");
    return;
  }
  const issue = snapshot.data();
  const issueId = event.params.issueId;

  console.log(`Processing new issue: ${issueId} - "${issue.title}"`);

  try {
    // 1. Get all admin users from 'users' collection
    const adminsSnapshot = await db.collection("users")
      .where("role", "==", "admin")
      .get();

    if (adminsSnapshot.empty) {
      console.log("No administrators found to notify.");
      return;
    }

    // 2. Create notification documents for each admin
    const batch = db.batch();
    adminsSnapshot.forEach((doc) => {
      const adminId = doc.id;
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        userId: adminId,
        title: "New Civic Issue Reported",
        message: `New complaint reported by ${issue.userName || "a citizen"}: "${issue.title}" (${issue.category || "General"}).`,
        read: false,
        createdAt: new Date().toISOString(),
        issueId: issueId,
        category: "reports",
        urgency: issue.severity || "medium",
      });
    });

    await batch.commit();
    console.log(`Successfully created notifications for ${adminsSnapshot.size} administrators.`);
  } catch (error) {
    console.error("Error in notifyAdminsOnIssueCreated:", error);
  }
});

/**
 * Cloud Function: notifyCitizenOnStatusChange
 * Trigger: Firestore onUpdate on collection 'issues'
 * Responsibilities:
 * - If status changes, create a notification document for the reporting citizen
 */
export const notifyCitizenOnStatusChange = onDocumentUpdated({
  document: "issues/{issueId}",
  database: DATABASE_ID
}, async (event) => {
  const change = event.data;
  if (!change) {
    console.log("No change data associated with this event.");
    return;
  }

  const before = change.before.data();
  const after = change.after.data();
  const issueId = event.params.issueId;

  if (!before || !after) {
    return;
  }

  // Ensure duplicate notifications are not generated when unrelated fields change
  if (before.status === after.status) {
    console.log(`Status did not change for issue ${issueId} (current status: ${after.status})`);
    return;
  }

  console.log(`Status changed for issue ${issueId}: "${before.status}" -> "${after.status}"`);

  // Map status values to user-friendly names for the message
  const statusLabels = {
    'reported': 'Reported',
    'under_review': 'Under Review',
    'assigned': 'Assigned',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'reopened': 'Reopened',
    'paused': 'Paused',
    'closed': 'Closed'
  };

  const newStatusLabel = statusLabels[after.status] || after.status;

  try {
    const ownerId = after.userId;
    if (!ownerId) {
      console.log(`No ownerId found for issue ${issueId}`);
      return;
    }

    // Verify if owner's notifications are enabled
    const userDoc = await db.collection("users").doc(ownerId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.notificationsEnabled === false) {
        console.log(`Notifications are disabled for user ${ownerId}. Skipping notification creation.`);
        return;
      }
    }

    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      userId: ownerId,
      title: "Issue Status Updated",
      message: `The status of your report "${after.title}" has been updated to "${newStatusLabel}".`,
      read: false,
      createdAt: new Date().toISOString(),
      issueId: issueId,
      category: "status_updates",
      urgency: "medium",
    });

    console.log(`Successfully created status update notification for citizen ${ownerId}`);
  } catch (error) {
    console.error("Error in notifyCitizenOnStatusChange:", error);
  }
});
