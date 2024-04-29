const { CloudTasksClient } = require('@google-cloud/tasks');
import { Timestamp } from 'firebase-admin/firestore';
import { SendNotificationsRequestData } from '../implementations/sendNotificationsTaskImplementation';

export async function sendNotificationsCloudTask(data: SendNotificationsRequestData) {
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION;
    const queueName = process.env.NOTIFICATIONS_QUEUE_NAME;
    console.log('sendNotificationsCloudTask for ' + data.notification.model_id);
    console.log(data);
    const client = new CloudTasksClient();
    const queuePath = client.queuePath(projectId, location, queueName);
    const serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL;
    const url = process.env.SEND_NOTIFICATIONS_TASK_IMPLEMENTATION_URL;
    const body = Buffer.from(JSON.stringify(data)).toString('base64');
    const taskName = `projects/${projectId}/locations/${location}/queues/${queueName}/tasks/${data.notification.model_id}-${Timestamp.now().toMillis().toString()}`;
    const task = {
        name: taskName,
        httpRequest: {
            httpMethod: 'POST',
            url,
            headers: {
                'Content-Type': 'application/json',
            },
            body,
            oidcToken: {
                serviceAccountEmail,
                audience: url,
            },
        },
    };
    const request = {
        parent: queuePath,
        task,
    };

    return client.createTask(request);
}