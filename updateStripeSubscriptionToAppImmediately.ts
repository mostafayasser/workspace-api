import Stripe from 'stripe';
import { StripeSubscriptionToAppMetadata } from '../../common/stripeSubscriptionToAppMetadata';
import { Constants } from '../../../../common/constants';
import { UpdateStripeSubscriptionToAppRequestData } from '../../common/updateStripeSubscriptionToAppRequestData';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });


async function handleCustomerBalance(requestData: UpdateStripeSubscriptionToAppRequestData) {
    const customer = await stripe.customers.retrieve(
        requestData.workspace_stripe_customer_id,
    ); // get the customer from stripe
    console.log("customer", customer);
    // if customer has a negative balance, this means that they have a credit balance. We need to deduct this credit balance from their account before creating another subscription.
    if (customer.deleted != true && customer.balance < 0) {
        const balanceTransaction = await stripe.customers.createBalanceTransaction(
            requestData.workspace_stripe_customer_id,
            { amount: -1 * customer.balance, currency: 'usd' }, // multiply by -1 to make the balance positive
        );
        console.log("balance transaction", balanceTransaction);
    }
}

export async function updateStripeSubscriptionToAppImmediately(requestData: UpdateStripeSubscriptionToAppRequestData) {
    try {
        var change_immediately = requestData.change_immediately;
        var scheduleId = requestData.stripe_schedule_subscription_id;
        if (scheduleId !== "") {
            await stripe.subscriptionSchedules.release(scheduleId);
        }
        await handleCustomerBalance(requestData);
        const metadata: StripeSubscriptionToAppMetadata = {
            workspace_id: requestData.workspace_id,
            subscription_type: Constants.webAppSubscription, // subscription type used to check in the webhook
        }
        const currentSubscription = await stripe.subscriptions.retrieve(
            requestData.stripe_subscription_id,
        ); // get the current subscription data
        const latestInvoiceId = currentSubscription.latest_invoice as string; // get the latest invoice id
        const invoice = await stripe.invoices.retrieve(latestInvoiceId); // get the latest invoice data
        // if the invoice is not paid, void the invoice so that we can create a new invoice
        if (invoice.status === "open" && change_immediately) {
            console.log("invoice.status", invoice.status);
            stripe.invoices.voidInvoice(latestInvoiceId);
        }
        const subscription = await stripe.subscriptions.update(
            requestData.stripe_subscription_id,
            {

                collection_method: 'charge_automatically', // send invoice to customer
                proration_behavior: 'none', // prorate the invoice if the subscription is increased and the invoice is paid like upgrading the more expensive plan
                billing_cycle_anchor: 'now', // change the billing cycle anchor to now if the subscription is increased or the invoice is not paid to create a new invoice
                items: [
                    {

                        id: requestData.stripe_subscription_item_id, // subscription item id to update the subscription
                        price: requestData.new_stripe_price_id, // new price id
                        quantity: 1,
                    },
                ],
                metadata: metadata,
            });
        await handleCustomerBalance(requestData);
        return {
            data: {
                stripe_subscription_id: subscription.id,
                stripe_subscription_item_id: subscription.items.data[0].id,
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
        stripe_price_id: "price_1OrkA5LNrHV1NjxUe0hxi87Y",
        stripe_subscription_id: "sub_1Osm4MLNrHV1NjxUe4w0BQls",
        stripe_schedule_subscription_id: "",
        stripe_subscription_item_id: "si_PiCTqklFRlq9Mc",
        change_immediately: true,
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

