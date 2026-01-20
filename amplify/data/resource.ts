import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*
 * Data Schema for Budget App
 * Securely stores Transactions, Budgets, and Goals per user.
 */

const schema = a.schema({
    Transaction: a
        .model({
            amount: a.float().required(),
            category: a.string().required(), // e.g. "Food", "Rent"
            date: a.date().required(),
            type: a.string().required(), // "income" or "expense"
            notes: a.string(),
            isRecurring: a.boolean(),
            frequency: a.string(), // "monthly", "weekly"
        })
        .authorization((allow) => [allow.owner()]), // Only creator can access

    Budget: a
        .model({
            category: a.string().required(),
            limitAmount: a.float().required(),
            period: a.string().default('monthly'), // "monthly"
            spent: a.float().default(0), // Calculated/Updated by helper logic
        })
        .authorization((allow) => [allow.owner()]),

    Goal: a
        .model({
            name: a.string().required(),
            targetAmount: a.float().required(),
            currentAmount: a.float().default(0),
            deadline: a.date(),
            // Gamification & UI
            icon: a.string().default('🎯'),
            color: a.string().default('#4f46e5'),
            isCompleted: a.boolean().default(false),
        })
        .authorization((allow) => [allow.owner()]),

    Settings: a
        .model({
            name: a.string(),
            occupation: a.string(),
            currency: a.string().default('USD'),
            location: a.string(),
            theme: a.string().default('light'), // 'light' or 'dark'
            budgetStartDay: a.integer().default(1),
            // We can store other prefs as JSON if needed, or discrete fields
            notifications: a.string(), // JSON string for { weekly: bool, ... }
            // Gamification
            points: a.integer().default(0),
            badges: a.string(), // JSON string of array
        })
        .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
