/* eslint-disable */
// Hand-curated query operations for the Designer.
// After backend changes, run `ampx generate graphql-client-code` from the
// umbrella to regenerate the full set; the ops below cover what the Designer
// needs at minimum.

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

export const getDigitalHome = /* GraphQL */ `
  query GetDigitalHome($smartHomeId: ID!) {
    getDigitalHome(smartHomeId: $smartHomeId) {
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

export const listDigitalHomes = /* GraphQL */ `
  query ListDigitalHomes(
    $filter: ModelDigitalHomeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDigitalHomes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
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

// ─── Device Inventory ──────────────────────────────────────────────────────
export const getDeviceModel = /* GraphQL */ `
  query GetDeviceModel($modelNumber: ID!) {
    getDeviceModel(modelNumber: $modelNumber) {
      brand
      category
      compatibleClasses
      createdAt
      description
      deviceType
      hasActorCapability
      hasControllerCapability
      hasSensorCapability
      modelNumber
      region
      s3DocPath
      s3ImgPath
      s3SpecsPath
      standards
      updatedAt
      __typename
    }
  }
`;
export const listDeviceModels = /* GraphQL */ `
  query ListDeviceModels(
    $filter: ModelDeviceModelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDeviceModels(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        brand
        category
        compatibleClasses
        createdAt
        description
        deviceType
        hasActorCapability
        hasControllerCapability
        hasSensorCapability
        modelNumber
        region
        s3DocPath
        s3ImgPath
        s3SpecsPath
        standards
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getDeviceInstance = /* GraphQL */ `
  query GetDeviceInstance($id: ID!) {
    getDeviceInstance(id: $id) {
      createdAt
      deviceType
      firmwareVersion
      id
      installationDate
      lifecycleState
      location
      modelNumber
      owners
      purchaseDate
      s3SpecsPath
      serialNumber
      smartHomeId
      updatedAt
      __typename
    }
  }
`;
export const listDeviceInstances = /* GraphQL */ `
  query ListDeviceInstances(
    $filter: ModelDeviceInstanceFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDeviceInstances(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        createdAt
        deviceType
        firmwareVersion
        id
        installationDate
        lifecycleState
        location
        modelNumber
        owners
        purchaseDate
        s3SpecsPath
        serialNumber
        smartHomeId
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listDeviceInstanceBySmartHomeId = /* GraphQL */ `
  query ListDeviceInstanceBySmartHomeId(
    $filter: ModelDeviceInstanceFilterInput
    $limit: Int
    $nextToken: String
    $smartHomeId: String!
    $sortDirection: ModelSortDirection
  ) {
    listDeviceInstanceBySmartHomeId(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      smartHomeId: $smartHomeId
      sortDirection: $sortDirection
    ) {
      items {
        createdAt
        deviceType
        firmwareVersion
        id
        installationDate
        lifecycleState
        location
        modelNumber
        owners
        purchaseDate
        s3SpecsPath
        serialNumber
        smartHomeId
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
