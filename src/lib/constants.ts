// lib/utils/constants.ts - Application constants
export const PROPERTY_TYPES = {
  "residential-lot": "Residential Lot",
  commercial: "Commercial",
  "house-and-lot": "House and Lot",
  condo: "Condominium",
  other: "Other",
} as const;

export const PAYMENT_METHODS = {
  cash: "Cash",
  financing: "Bank Financing",
  installment: "Installment",
} as const;

export const CONTACT_METHODS = {
  phone: "Phone Call",
  email: "Email",
  text: "Text Message",
} as const;

export const TIMELINES = {
  immediate: "Immediate",
  "1-3-months": "1-3 Months",
  "3-6-months": "3-6 Months",
  "6-12-months": "6-12 Months",
  flexible: "Flexible",
} as const;

export const INQUIRY_STATUSES = {
  new: "New",
  contacted: "Contacted",
  "viewing-scheduled": "Viewing Scheduled",
  negotiating: "Negotiating",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
} as const;

export const PROPERTY_STATUSES = {
  rented: "Rented",
  sold: "Sold",
  reserved: "Reserved",
} as const;

export const PAYMENT_STATUSES = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
} as const;

export const PRIORITIES = {
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;
