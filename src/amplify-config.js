import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

/**
 * Helper to check current user session
 */
export async function getCurrentUser() {
    try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        return await getCurrentUser();
    } catch (err) {
        return null;
    }
}
