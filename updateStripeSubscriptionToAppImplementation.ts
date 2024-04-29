import { UpdateStripeSubscriptionToAppRequestData } from '../../common/updateStripeSubscriptionToAppRequestData';
import { updateStripeSubscriptionToAppImmediately } from './updateStripeSubscriptionToAppImmediately';
import { updateStripeSubscriptionToAppPeriodEnd } from './updateStripeSubscriptionToAppPeriodEnd';




export async function updateStripeSubscriptionToAppImplementation(requestData: UpdateStripeSubscriptionToAppRequestData) {
    var change_immediately = requestData.change_immediately;
    try {
        if (change_immediately) {
            var result: any = await updateStripeSubscriptionToAppImmediately(requestData);
            return result;
        } else {
            var result: any = await updateStripeSubscriptionToAppPeriodEnd(requestData);
            return result;
        }
    } catch (err: any) {
        throw err;
    }
};

// iron subscription
//"price_1OSLuNLNrHV1NjxU271Om2dJ" dev //"price_1OTUFZLNrHV1NjxUuPyHFuL0" prod
//"price_1OSLwKLNrHV1NjxUdqkzuFxT" dev //"price_1OUv70LNrHV1NjxUIzJBGPbV" prod
// gold subscription
//"price_1OrkA5LNrHV1NjxUe0hxi87Y" dev //"price_1OrkDSLNrHV1NjxUWEZyhYJD" prod
//"price_1OrkAhLNrHV1NjxU8Zs0wrEw" dev //"price_1OrkDdLNrHV1NjxUNTpK6q7P" prod

/* 
updateStripeSubscriptionToApp({
    data: {
        workspace_id: "W9BgSKB5VamC1RCgweQC",
        workspace_stripe_customer_id: "cus_PJXyDa6TpmCrOS",
        stripe_price_id: "price_1OrkA5LNrHV1NjxUe0hxi87Y",
        stripe_subscription_id: "sub_1OrmH3LNrHV1NjxUHP9uNukU",
        stripe_subscription_item_id: "si_PhAcrsK8nveA2V",
        change_immediately: false,
    }
}) 

updateStripeSubscriptionToApp({
    data: {
        workspace_id: "7lFWszLLdtAd8YNcfvCR",
        workspace_stripe_customer_id: "cus_PI58pi54Q1gtxz",
        stripe_price_id: "price_1OSLuNLNrHV1NjxU271Om2dJ",
        increase: false,
        stripe_subscription_id: "sub_1OoqD6LNrHV1NjxUbWSZXlY5",
        stripe_subscription_item_id: "si_Pe8Ua6IUtE8fXm",
    }
})

*/

