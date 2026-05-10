/* eslint-disable */
// Hand-curated mutation operations for the Designer.
// After backend changes, run `ampx generate graphql-client-code` from the
// umbrella to regenerate the full set; the ops below cover what the Designer
// needs at minimum.

export const initiateDigitalHome = /* GraphQL */ `
  mutation InitiateDigitalHome(
    $country: String!
    $postalCode: String!
    $streetCode: String!
    $houseNumber: String!
    $suffix: String!
    $city: String!
    $addressLine1: String!
    $addressLine2: String
    $isDemo: Boolean!
  ) {
    initiateDigitalHome(
      country: $country
      postalCode: $postalCode
      streetCode: $streetCode
      houseNumber: $houseNumber
      suffix: $suffix
      city: $city
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      isDemo: $isDemo
    ) {
      smartHomeId
      createdAt
      __typename
    }
  }
`;

export const deleteDigitalHome = /* GraphQL */ `
  mutation DeleteDigitalHome(
    $condition: ModelDigitalHomeConditionInput
    $input: DeleteDigitalHomeInput!
  ) {
    deleteDigitalHome(condition: $condition, input: $input) {
      smartHomeId
      __typename
    }
  }
`;

export const updateDigitalHome = /* GraphQL */ `
  mutation UpdateDigitalHome(
    $condition: ModelDigitalHomeConditionInput
    $input: UpdateDigitalHomeInput!
  ) {
    updateDigitalHome(condition: $condition, input: $input) {
      smartHomeId
      country
      postalCode
      streetCode
      houseNumber
      suffix
      city
      addressLine1
      addressLine2
      isDemo
      createdBy
      owners
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const requestDesignReadUrl = /* GraphQL */ `
  mutation RequestDesignReadUrl($fileName: String!, $smartHomeId: ID!) {
    requestDesignReadUrl(fileName: $fileName, smartHomeId: $smartHomeId) {
      contentType
      expiresAt
      url
      __typename
    }
  }
`;

export const requestDigitalHomeReadUrl = /* GraphQL */ `
  mutation RequestDigitalHomeReadUrl($smartHomeId: ID!, $fileName: String!) {
    requestDigitalHomeReadUrl(
      smartHomeId: $smartHomeId
      fileName: $fileName
    ) {
      contentType
      expiresAt
      url
      __typename
    }
  }
`;

export const requestDesignWriteUrl = /* GraphQL */ `
  mutation RequestDesignWriteUrl(
    $contentType: String
    $fileName: String!
    $smartHomeId: ID!
  ) {
    requestDesignWriteUrl(
      contentType: $contentType
      fileName: $fileName
      smartHomeId: $smartHomeId
    ) {
      contentType
      expiresAt
      url
      __typename
    }
  }
`;

export const createLibraryItem = /* GraphQL */ `
  mutation CreateLibraryItem(
    $condition: ModelLibraryItemConditionInput
    $input: CreateLibraryItemInput!
  ) {
    createLibraryItem(condition: $condition, input: $input) {
      compatibleClasses
      createdAt
      description
      hasActorCapability
      hasControllerCapability
      hasSensorCapability
      id
      region
      standards
      title
      updatedAt
      version
      __typename
    }
  }
`;

export const updateLibraryItem = /* GraphQL */ `
  mutation UpdateLibraryItem(
    $condition: ModelLibraryItemConditionInput
    $input: UpdateLibraryItemInput!
  ) {
    updateLibraryItem(condition: $condition, input: $input) {
      compatibleClasses
      createdAt
      description
      hasActorCapability
      hasControllerCapability
      hasSensorCapability
      id
      region
      standards
      title
      updatedAt
      version
      __typename
    }
  }
`;

export const deleteLibraryItem = /* GraphQL */ `
  mutation DeleteLibraryItem(
    $condition: ModelLibraryItemConditionInput
    $input: DeleteLibraryItemInput!
  ) {
    deleteLibraryItem(condition: $condition, input: $input) {
      id
      __typename
    }
  }
`;

export const createSmartHomeDesign = /* GraphQL */ `
  mutation CreateSmartHomeDesign(
    $condition: ModelSmartHomeDesignConditionInput
    $input: CreateSmartHomeDesignInput!
  ) {
    createSmartHomeDesign(condition: $condition, input: $input) {
      createdAt
      id
      lastModified
      lockedAt
      lockedBy
      ontologyVersion
      owners
      smartHomeId
      updatedAt
      version
      __typename
    }
  }
`;

export const updateSmartHomeDesign = /* GraphQL */ `
  mutation UpdateSmartHomeDesign(
    $condition: ModelSmartHomeDesignConditionInput
    $input: UpdateSmartHomeDesignInput!
  ) {
    updateSmartHomeDesign(condition: $condition, input: $input) {
      createdAt
      id
      lastModified
      lockedAt
      lockedBy
      ontologyVersion
      owners
      smartHomeId
      updatedAt
      version
      __typename
    }
  }
`;

export const deleteSmartHomeDesign = /* GraphQL */ `
  mutation DeleteSmartHomeDesign(
    $condition: ModelSmartHomeDesignConditionInput
    $input: DeleteSmartHomeDesignInput!
  ) {
    deleteSmartHomeDesign(condition: $condition, input: $input) {
      id
      __typename
    }
  }
`;

export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile(
    $condition: ModelUserProfileConditionInput
    $input: CreateUserProfileInput!
  ) {
    createUserProfile(condition: $condition, input: $input) {
      createdAt
      displayName
      email
      id
      locale
      marketingOptIn
      owner
      updatedAt
      __typename
    }
  }
`;

export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile(
    $condition: ModelUserProfileConditionInput
    $input: UpdateUserProfileInput!
  ) {
    updateUserProfile(condition: $condition, input: $input) {
      createdAt
      displayName
      email
      id
      locale
      marketingOptIn
      owner
      updatedAt
      __typename
    }
  }
`;

export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $condition: ModelUserProfileConditionInput
    $input: DeleteUserProfileInput!
  ) {
    deleteUserProfile(condition: $condition, input: $input) {
      id
      __typename
    }
  }
`;
