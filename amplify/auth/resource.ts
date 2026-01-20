import { defineAuth } from '@aws-amplify/backend';

/**
 * Auth Configuration
 * uses Email/Password as primary login.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
});
