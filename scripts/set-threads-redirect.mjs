#!/usr/bin/env node
/**
 * One-time script to set Threads OAuth redirect URI via Meta Graph API.
 * Run: node scripts/set-threads-redirect.mjs
 */

const APP_ID = '937981971970072';
const APP_SECRET = '4ccf3c3db095cc3ab15b2c38f4e5d9ff';
const REDIRECT_URI = 'https://bibllab.com/api/threads/auth/callback';

async function main() {
  // Step 1: Get App Access Token
  const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`;
  console.log('Getting app access token...');
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('Failed to get access token:', tokenData);
    process.exit(1);
  }
  console.log('Got access token:', tokenData.access_token.substring(0, 20) + '...');

  // Step 2: Read current app settings to see what fields are available
  const readUrl = `https://graph.facebook.com/v19.0/${APP_ID}?fields=id,name,redirect_uris,auth_referral_enabled&access_token=${tokenData.access_token}`;
  console.log('\nReading current app settings...');
  const readRes = await fetch(readUrl);
  const readData = await readRes.json();
  console.log('Current settings:', JSON.stringify(readData, null, 2));

  // Step 3: Try to update redirect_uris
  console.log('\nAttempting to update redirect_uris...');
  const updateUrl = `https://graph.facebook.com/v19.0/${APP_ID}`;
  const body = new URLSearchParams({
    redirect_uris: JSON.stringify([REDIRECT_URI]),
    access_token: tokenData.access_token,
  });
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    body: body,
  });
  const updateData = await updateRes.json();
  console.log('Update result:', JSON.stringify(updateData, null, 2));

  // Step 4: Also try th_oauth_redirect_uris (Threads-specific)
  console.log('\nAttempting to update th_oauth_redirect_uris...');
  const body2 = new URLSearchParams({
    th_oauth_redirect_uris: JSON.stringify([REDIRECT_URI]),
    access_token: tokenData.access_token,
  });
  const updateRes2 = await fetch(updateUrl, {
    method: 'POST',
    body: body2,
  });
  const updateData2 = await updateRes2.json();
  console.log('th_oauth_redirect_uris result:', JSON.stringify(updateData2, null, 2));
}

main().catch(console.error);
