export enum EventType {
  USER_CREATED = "user.created",
  USER_DELETED = "user.deleted",
}

// Common event types
interface EventAttributes {
  http_request: EventHttpRequest;
}

interface EventHttpRequest {
  client_ip: string;
  user_agent: string;
}

export interface EmailAddress {
  email_address: string;
}

export interface PhoneNumber {
  phone_number: string;
}

// User data
export interface UserEventData {
  birthday: string;
  created_at: number;
  email_addresses: EmailAddress[];
  external_id: string;
  first_name: string;
  gender: string;
  id: string;
  image_url: string;
  last_name: string;
  last_sign_in_at: number;
  object: "user";
  password_enabled: boolean;
  phone_numbers: PhoneNumber[];
  primary_email_address_id: string;
  primary_phone_number_id: null | string;
  primary_web3_wallet_id: null | string;
  private_metadata: Record<string, unknown>;
  profile_image_url: string;
  public_metadata: Record<string, unknown>;
  two_factor_enabled: boolean;
  unsafe_metadata: Record<string, unknown>;
  updated_at: number;
  username: null | string;
}

export interface ClerkEvent {
  data: UserEventData;
  event_attributes: EventAttributes;
  object: "event";
  timestamp: number;
  type: EventType;
}
