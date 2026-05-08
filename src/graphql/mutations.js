/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
export const createSmartHome = /* GraphQL */ `
  mutation CreateSmartHome(
    $condition: ModelSmartHomeConditionInput
    $input: CreateSmartHomeInput!
  ) {
    createSmartHome(condition: $condition, input: $input) {
      address
      country
      createdAt
      description
      houseNumber
      id
      ownerName
      owners
      streetCode
      suffix
      updatedAt
      zip
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
export const deleteLibraryItem = /* GraphQL */ `
  mutation DeleteLibraryItem(
    $condition: ModelLibraryItemConditionInput
    $input: DeleteLibraryItemInput!
  ) {
    deleteLibraryItem(condition: $condition, input: $input) {
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
export const deleteSmartHome = /* GraphQL */ `
  mutation DeleteSmartHome(
    $condition: ModelSmartHomeConditionInput
    $input: DeleteSmartHomeInput!
  ) {
    deleteSmartHome(condition: $condition, input: $input) {
      address
      country
      createdAt
      description
      houseNumber
      id
      ownerName
      owners
      streetCode
      suffix
      updatedAt
      zip
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
export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $condition: ModelUserProfileConditionInput
    $input: DeleteUserProfileInput!
  ) {
    deleteUserProfile(condition: $condition, input: $input) {
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
export const updateSmartHome = /* GraphQL */ `
  mutation UpdateSmartHome(
    $condition: ModelSmartHomeConditionInput
    $input: UpdateSmartHomeInput!
  ) {
    updateSmartHome(condition: $condition, input: $input) {
      address
      country
      createdAt
      description
      houseNumber
      id
      ownerName
      owners
      streetCode
      suffix
      updatedAt
      zip
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
