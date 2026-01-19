import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
    Goal: a.model({
        name: a.string().required(),
        target: a.float().required(),
        current: a.float(),
        dueDate: a.date(),
        type: a.string(), // savings/debt
    }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
