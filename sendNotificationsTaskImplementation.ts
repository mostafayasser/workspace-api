import { https } from "firebase-functions";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';

import { INotification } from "../../../interfaces/iNotification";
import { collections } from "../../../helpers/firestoreCollections";
import { convertObjectToJsonMap } from "../../../helpers/convertObjectToJsonMap";
//import { IReturn } from "../../../interfaces/iReturn";
import { ITeamMemberPermission } from "../../../interfaces/iTeamMemberPermission";
import { IReturn } from "../../../interfaces/iReturn";

export type SendNotificationsRequestData = {
    title: string;
    body: string;
    data: any;
    workspace_id: string;
    notification: INotification;
}

export const sendNotificationsTaskImplementation = functions.https.onRequest(async (req, res) => {
    //export async function sendNotificationsTaskImplementation(req: SendNotificationsRequestData) {
    console.log("sendNotificationsTaskImplementation");
    const requestData: SendNotificationsRequestData = req.body;
    console.log(requestData);
    const workspaceId = requestData.workspace_id;
    const notification = requestData.notification;
    try {
        const workspaceRef = await collections.getWorkspaceCollection(workspaceId);
        const workspaceDoc = await workspaceRef.get();
        if (!workspaceDoc.exists) {
            throw new https.HttpsError('not-found', `Workspace ${workspaceId} not found`);
        }
        const grantedPermissionsRef = await collections.getGrantedPermissionsCollection(workspaceId); // get the granted permissions collection from the workspace id
        const grantedPermissionsDocs = await grantedPermissionsRef.get(); // get the granted permissions from the workspace id
        const grantedPermissions: ITeamMemberPermission[] = grantedPermissionsDocs.docs.map(doc => doc.data() as ITeamMemberPermission); // get the granted permissions data from the docs
        let tokens: any = [];
        // Loop through each permission object
        for (const permission of grantedPermissions) {
            console.log(convertObjectToJsonMap(permission));
            const preference = notification.model_sub_type; // get the preference from the notification
            var permissionPreferences = permission.workspace_notification_preferences; // get the workspace notification preferences from the permission
            // check if the permission has workspace_notifications_preferences
            if (!permissionPreferences) {
                permissionPreferences = {
                    estimate_accepted_notification: true,
                    estimate_declined_notification: true,
                    estimate_viewed_notification: true,
                    estimate_scheduled_notification: true,
                    invoice_viewed_notification: true,
                    invoice_paid_notification: true,
                }; // set the default preferences
            }
            // check if the preference is set to true inside permission workspace_notifications_preferences
            if (permissionPreferences.hasOwnProperty(preference)) {
                var preferences = convertObjectToJsonMap(permissionPreferences); // convert the permission preferences to json map
                console.log("preferences: ");
                console.log(preferences);
                var keyToCheck = preference; // get the preference key to check from the notification
                console.log("keyToCheck: " + keyToCheck);
                console.log("preferences[keyToCheck]: " + preferences[keyToCheck]);
                // check if the preference is set to true
                if (preferences[keyToCheck] === true) {
                    console.log("preferences[keyToCheck] === true");
                    // Access the user_devices property
                    const userDevices = permission.user_devices; // get the user devices from the permission
                    // If user_devices is present, iterate through the devices
                    if (userDevices) {
                        for (const [, device] of Object.entries(userDevices)) {
                            console.log(convertObjectToJsonMap(device));
                            // Loop through each device in the array
                            const fcmToken = device.fcm_token; // get the fcm token from the device
                            console.log(fcmToken);
                            tokens.push(fcmToken); // push the fcm token to the tokens array
                        }
                    }
                }
            }

        }
        console.log(tokens);
        // remove duplicates
        if (tokens.length > 0) {
            // remove duplicates
            tokens = Array.from(new Set(tokens)); // remove duplicates from the tokens array
            const payload = {
                tokens: tokens, // send notification to the tokens array
                notification: {
                    title: requestData.title,
                    body: requestData.body,
                },
                data: requestData.data,
            };
            console.log("Sending notification to user");
            console.log(JSON.stringify(payload, null, 4));
            var notifcationResult = await admin.messaging().sendEachForMulticast(payload); // send the notification to the tokens array
            console.log(JSON.stringify(notifcationResult, null, 4));
            const notificationCollectionRef = await collections.getNotificationsCollection(workspaceId); // get the notifications collection from the workspace id
            const notificationDoc = notificationCollectionRef.doc(); // create a new notification doc
            notification.id = notificationDoc.id; // set the notification id to the notification doc id
            await notificationDoc.set(convertObjectToJsonMap(notification)); // save the notification doc
            console.log("notification sent");
        }
        // Return the document data.
        const returnData: IReturn = {
            data: true,
            statusCode: 200,
            message: "Success",
        };

        res.status(200).send(returnData).end();
    } catch (error: any) {
        functions.logger.error('Error sending notifications:', error);
        const returnData: IReturn = {
            data: error,
            statusCode: 500,
            message: error.message,
        };
        res.status(500).send(returnData).end();
    }
});

/* sendNotificationsTaskImplementation({
    title: "title",
    body: "body",
    data: { workspace_id: "W9BgSKB5VamC1RCgweQC", category: "Invoice", invoice_id: "invoice_id" },
    workspace_id: "W9BgSKB5VamC1RCgweQC",
    notification: {
        id: "",
        _created_at: admin.firestore.Timestamp.now().toMillis(),
        title: "title",
        body: "body",
        model_id: "invoice_id",
        model_type: "Invoice",
        model_sub_type: "invoice_viewed_notification",
        is_read: false,
    }
}); */

