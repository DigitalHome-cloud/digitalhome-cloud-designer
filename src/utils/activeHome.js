// Backend persistence for the active-home selection, shared across apps via
// UserProfile.activeSmartHomeId. Inline GraphQL because the generated
// UserProfile ops predate the activeSmartHomeId field (so their selection sets
// don't include it). Owner-auth means each user reads/writes only their row.

import { generateClient } from "aws-amplify/api";

const LIST_MY_PROFILE = /* GraphQL */ `
  query ListMyProfile($owner: String!) {
    listUserProfiles(filter: { owner: { eq: $owner } }, limit: 1) {
      items { id activeSmartHomeId }
    }
  }
`;

const UPDATE_ACTIVE_HOME = /* GraphQL */ `
  mutation UpdateActiveHome($id: ID!, $activeSmartHomeId: String) {
    updateUserProfile(input: { id: $id, activeSmartHomeId: $activeSmartHomeId }) {
      id
      activeSmartHomeId
    }
  }
`;

const CREATE_ACTIVE_HOME = /* GraphQL */ `
  mutation CreateActiveHome($activeSmartHomeId: String) {
    createUserProfile(input: { activeSmartHomeId: $activeSmartHomeId }) {
      id
      activeSmartHomeId
    }
  }
`;

// Read the caller's persisted selection. Returns { profileId, activeSmartHomeId }
// or null (no profile row / not signed in / error).
export async function fetchProfileActiveHome(owner) {
  if (!owner) return null;
  try {
    const client = generateClient();
    const res = await client.graphql({
      query: LIST_MY_PROFILE,
      variables: { owner },
      authMode: "userPool",
    });
    const item = res?.data?.listUserProfiles?.items?.[0];
    return item
      ? { profileId: item.id, activeSmartHomeId: item.activeSmartHomeId || null }
      : null;
  } catch (err) {
    console.warn("[activeHome] fetch failed:", err);
    return null;
  }
}

// Persist the selection; creates the profile row if the user has none yet.
// Fire-and-forget — never throws into the UI. Returns the (possibly new) id.
export async function persistActiveHome(profileId, id) {
  try {
    const client = generateClient();
    if (profileId) {
      await client.graphql({
        query: UPDATE_ACTIVE_HOME,
        variables: { id: profileId, activeSmartHomeId: id || null },
        authMode: "userPool",
      });
      return profileId;
    }
    const res = await client.graphql({
      query: CREATE_ACTIVE_HOME,
      variables: { activeSmartHomeId: id || null },
      authMode: "userPool",
    });
    return res?.data?.createUserProfile?.id || null;
  } catch (err) {
    console.warn("[activeHome] persist failed:", err);
    return profileId || null;
  }
}
