import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json'; // Expecting it in src/ for now, will adjust if needed

// Ensure configured (duplicate call is safe/ignored usually, but best to have one config point)
// We rely on amplify-config.js being imported effectively, or we config here.
// Better to just rely on the main config.

export const client = generateClient();
