import Stripe from 'stripe';
import { StripeSubscriptionToAppMetadata } from '../../common/stripeSubscriptionToAppMetadata';
import { Constants } from '../../../../common/constants';
import { UpdateStripeSubscriptionToAppRequestData } from '../../common/updateStripeSubscriptionToAppRequestData';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });


export async function updateStripeSubscriptionToAppPeriodEnd(requestData: UpdateStripeSubscriptionToAppRequestData) {
    try {
        const metadata: StripeSubscriptionToAppMetadata = {
            workspace_id: requestData.workspace_id,
            subscription_type: Constants.webAppSubscription, // subscription type used to check in the webhook
        }
        const currentSubscription = await stripe.subscriptions.retrieve(
            requestData.stripe_subscription_id,
        ); // get the current subscription data
        console.log("currentSubscription", currentSubscription);
        const currentPeriodStart = currentSubscription.current_period_start; // get the current subscription end date
        const currentPeriodEnd = currentSubscription.current_period_end; // get the current subscription end date
        console.log("currentPeriodStart", currentPeriodStart);
        console.log("currentPeriodEnd", currentPeriodEnd);
        var scheduleId = requestData.stripe_schedule_subscription_id;
        if (scheduleId === "") {
            var schedule = await stripe.subscriptionSchedules.create({
                from_subscription: requestData.stripe_subscription_id,
            });
            scheduleId = schedule.id;
        }
        var schedule = await stripe.subscriptionSchedules.update(scheduleId, {
            proration_behavior: 'none',
            phases: [ // phases are the different stages of the subscription schedule
                {
                    items: [ // items are the different products that are being purchased
                        {
                            price: requestData.current_stripe_price_id,
                        },
                    ],
                    proration_behavior: 'none', // don't edit subscription current price if customer changes plan. Only change price on next payment
                    start_date: currentPeriodStart, // start date of the phase
                    end_date: currentPeriodEnd, // end date of the phase
                },
                {
                    items: [ // items are the different products that are being purchased
                        {
                            price: requestData.new_stripe_price_id,
                        },
                    ],
                    proration_behavior: 'none', // don't edit subscription current price if customer changes plan. Only change price on next payment
                    start_date: currentPeriodEnd, // start date of the phase
                },
            ],
            metadata: metadata,
        });
        const subscription = await stripe.subscriptions.retrieve(requestData.stripe_subscription_id);
        const subscriptionItem = subscription.items.data[0].id;
        return {
            data: {
                stripe_schedule_subscription_id: scheduleId,
                stripe_subscription_item_id: subscriptionItem,
            },
            statusCode: 200,
            message: "Success",
        };
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
        workspace_stripe_customer_id: "cus_PhsjcmKb6xsIAk",
        stripe_price_id: "price_1OSLwKLNrHV1NjxUdqkzuFxT",
        stripe_subscription_id: "sub_1Osm4MLNrHV1NjxUe4w0BQls",
        stripe_schedule_subscription_id: "sub_sched_1OsmGOLNrHV1NjxUPIG7bzhG",
        stripe_subscription_item_id: "si_PiCTqklFRlq9Mc",
        change_immediately: false,
    }
}) 


updateStripeSubscriptionToApp({
    data: {
        workspace_id: "7lFWszLLdtAd8YNcfvCR",
        workspace_stripe_customer_id: "cus_PI58pi54Q1gtxz",
        stripe_price_id: "",
        increase: false,
        stripe_subscription_id: "sub_1OoqD6LNrHV1NjxUbWSZXlY5",
        stripe_subscription_item_id: "si_Pe8Ua6IUtE8fXm",
    }
})

*/

