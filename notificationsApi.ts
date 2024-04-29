import { INotificationsApi } from "../../../interfaces/api/iNotificationsApi";
import { sendNotificationsCloudTask } from "../cloudTasks/sendNotificationsCloudTask";
import { SendNotificationsRequestData } from "../implementations/sendNotificationsTaskImplementation";
//import { https } from "firebase-functions/v2";

export const NotificationsApi: INotificationsApi = {
    sendNotifications: async (request: SendNotificationsRequestData) => {
        try {
            var result = await sendNotificationsCloudTask(request);
            return result;
        } catch (error: any) {
            return {
                data: error,
                statusCode: 500,
                message: error.message,
            }
        }
    },
}