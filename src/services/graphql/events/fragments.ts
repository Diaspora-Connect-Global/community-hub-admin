/**
 * GraphQL fragments for Event Service types.
 * Reuse across queries and mutations.
 */

export const EVENT_LOCATION_FRAGMENT = `
  fragment EventLocationInfo on EventLocationDetails {
    type
    venueName
    address
    city
    country
    virtualLink
    platform
  }
`;

/** Slim event shape for list views */
export const EVENT_CARD_FRAGMENT = `
  fragment EventCardInfo on EventGQL {
    id
    title
    description
    status
    startAt
    endAt
    eventCategory
    locationType
    locationDetails {
      ...EventLocationInfo
    }
    isPaid
    registrationCount
    availableSpots
    coverImageUrl
    tags
    timezone
    createdAt
    updatedAt
  }
`;

/** Full event shape including tickets and registration state */
export const EVENT_FULL_FRAGMENT = `
  fragment EventFullInfo on EventGQL {
    id
    title
    description
    status
    startAt
    endAt
    eventCategory
    locationType
    locationDetails {
      ...EventLocationInfo
    }
    isPaid
    registrationCount
    availableSpots
    isRegistered
    canRegister
    tickets {
      id
      name
      priceInCents
      description
      availableQuantity
    }
    coverImageUrl
    tags
    timezone
    createdAt
    updatedAt
  }
`;

export const EVENT_REGISTRATION_FRAGMENT = `
  fragment EventRegistrationInfo on EventRegistrationGQL {
    id
    eventId
    userId
    ticketId
    quantity
    status
    totalAmount
    currency
    registeredAt
    confirmedAt
    cancelledAt
    createdAt
  }
`;
