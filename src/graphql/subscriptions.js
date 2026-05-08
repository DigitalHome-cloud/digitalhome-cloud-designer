/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateLibraryItem = /* GraphQL */ `
  subscription OnCreateLibraryItem(
    $filter: ModelSubscriptionLibraryItemFilterInput
  ) {
    onCreateLibraryItem(filter: $filter) {
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
export const onCreateSmartHome = /* GraphQL */ `
  subscription OnCreateSmartHome(
    $filter: ModelSubscriptionSmartHomeFilterInput
  ) {
    onCreateSmartHome(filter: $filter) {
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
export const onCreateSmartHomeDesign = /* GraphQL */ `
  subscription OnCreateSmartHomeDesign(
    $filter: ModelSubscriptionSmartHomeDesignFilterInput
  ) {
    onCreateSmartHomeDesign(filter: $filter) {
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
export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onCreateUserProfile(filter: $filter, owner: $owner) {
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
export const onDeleteLibraryItem = /* GraphQL */ `
  subscription OnDeleteLibraryItem(
    $filter: ModelSubscriptionLibraryItemFilterInput
  ) {
    onDeleteLibraryItem(filter: $filter) {
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
export const onDeleteSmartHome = /* GraphQL */ `
  subscription OnDeleteSmartHome(
    $filter: ModelSubscriptionSmartHomeFilterInput
  ) {
    onDeleteSmartHome(filter: $filter) {
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
export const onDeleteSmartHomeDesign = /* GraphQL */ `
  subscription OnDeleteSmartHomeDesign(
    $filter: ModelSubscriptionSmartHomeDesignFilterInput
  ) {
    onDeleteSmartHomeDesign(filter: $filter) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onDeleteUserProfile(filter: $filter, owner: $owner) {
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
export const onUpdateLibraryItem = /* GraphQL */ `
  subscription OnUpdateLibraryItem(
    $filter: ModelSubscriptionLibraryItemFilterInput
  ) {
    onUpdateLibraryItem(filter: $filter) {
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
export const onUpdateSmartHome = /* GraphQL */ `
  subscription OnUpdateSmartHome(
    $filter: ModelSubscriptionSmartHomeFilterInput
  ) {
    onUpdateSmartHome(filter: $filter) {
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
export const onUpdateSmartHomeDesign = /* GraphQL */ `
  subscription OnUpdateSmartHomeDesign(
    $filter: ModelSubscriptionSmartHomeDesignFilterInput
  ) {
    onUpdateSmartHomeDesign(filter: $filter) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onUpdateUserProfile(filter: $filter, owner: $owner) {
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
