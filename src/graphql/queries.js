/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getLibraryItem = /* GraphQL */ `
  query GetLibraryItem($id: ID!) {
    getLibraryItem(id: $id) {
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
export const getSmartHome = /* GraphQL */ `
  query GetSmartHome($id: ID!) {
    getSmartHome(id: $id) {
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
export const getSmartHomeDesign = /* GraphQL */ `
  query GetSmartHomeDesign($id: ID!) {
    getSmartHomeDesign(id: $id) {
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
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
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
export const listLibraryItems = /* GraphQL */ `
  query ListLibraryItems(
    $filter: ModelLibraryItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLibraryItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const listSmartHomeDesignBySmartHomeId = /* GraphQL */ `
  query ListSmartHomeDesignBySmartHomeId(
    $filter: ModelSmartHomeDesignFilterInput
    $limit: Int
    $nextToken: String
    $smartHomeId: String!
    $sortDirection: ModelSortDirection
  ) {
    listSmartHomeDesignBySmartHomeId(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      smartHomeId: $smartHomeId
      sortDirection: $sortDirection
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const listSmartHomeDesigns = /* GraphQL */ `
  query ListSmartHomeDesigns(
    $filter: ModelSmartHomeDesignFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSmartHomeDesigns(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const listSmartHomes = /* GraphQL */ `
  query ListSmartHomes(
    $filter: ModelSmartHomeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSmartHomes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
