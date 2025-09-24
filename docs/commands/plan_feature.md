# Product Requirements Document (PRD) for Property Management System

## 1. Document Overview
### 1.1 Purpose
This PRD defines the requirements for a Property Management System (PMS) based on the provided code snippets. The system enables property owners/admins to manage listings, handle tenant inquiries/applications, approve/reject applications, and set up lease plans. Tenants can view properties, submit applications, and make monthly payments for leased properties.

The system is built as a web application using React, Next.js (implied by "use client"), and UI libraries like Shadcn/UI, Mantine, and Lucide icons. It interacts with a backend API (e.g., `/api/properties`, `/api/inquiries`, `/api/transactions`, `/api/property-inquiries`, `/api/property-leases`) for data persistence.

### 1.2 Scope
- **In Scope**: Property creation/editing/deletion, inquiry submission, application management (approve/reject), lease plan setup, basic payment processing.
- **Out of Scope**: Advanced features like user authentication (assumed to exist), full payment gateway integration (e.g., Stripe), legal document generation, multi-tenancy support, analytics dashboards, mobile responsiveness (unless specified in code).

### 1.3 Target Users
- **Admin/Property Owner**: Manages properties and applications.
- **Tenant/User**: Browses properties, applies, and pays.

### 1.4 Key Assumptions
- Backend API endpoints exist and handle CRUD operations for properties, inquiries, and leases.
- Users are authenticated (e.g., via sessions or JWT).
- Currency is primarily USD or PHP (mixed in code; standardize to one, e.g., USD).
- No real-time updates (e.g., via WebSockets); relies on polling or refreshes.
- Data validation and error handling are implemented in the backend.

### 1.5 Success Metrics
- Admin can create and manage at least 50 properties with pagination.
- 95% of inquiries processed (approved/rejected) within the UI without errors.
- Tenants can submit inquiries and view payment status seamlessly.

## 2. User Roles and Permissions
### 2.1 Admin
- Create, edit, delete properties.
- View, approve, reject tenant applications (inquiries).
- Set custom lease plans during approval.
- View transactions and process payments.

### 2.2 Tenant
- View property details.
- Submit inquiries/applications for properties.
- View and pay monthly installments for leased properties.

## 3. Functional Requirements
### 3.1 Property Management (Admin)
- **Create Property**: Form to add new property with fields:
  - Title (string, required)
  - Location/Address (string, required)
  - Size (string, e.g., "300 sqm", required)
  - Price (number/string, e.g., "2500000", required)
  - Type (select: "residential-lot", "commercial", "house-and-lot", "condo", required)
  - Status (select: "CREATED", "UNDER_INQUIRY", "APPROVED", "REJECTED", "LEASED"; default "CREATED")
  - Images (file upload, multiple, optional; simulate URLs in frontend)
  - Amenities (multi-select: e.g., "parking", "gym", "security", "internet-ready", "garden"; optional)
  - Description (textarea, optional)
  - Bedrooms/Bathrooms/Sqft (numbers, conditional on type "house-and-lot" or "condo")
- **Edit Property**: Similar form to create, pre-filled with existing data.
- **Delete Property**: Confirm deletion via API.
- **List Properties**: Table view with columns: Property (title + image), Location, Type, Size, Price, Status, Actions (view, edit, delete, inquire if "CREATED", pay if "APPROVED").
  - Search by title/location.
  - Pagination (limit 50 per page).
  - Stats cards: Total Listed, Under Inquiry, Leased.
- **View Property Details**: Modal with images, description, amenities, owner info, inquiry status.

### 3.2 Tenant Property Viewing and Inquiry
- **View Property Details**: Page/section showing:
  - Title, location, price, type, size, images (gallery).
  - Description, amenities (with icons).
  - Key features (bedrooms, bathrooms, sqft if applicable).
  - Contact form for inquiry (full name, email, phone, message; required fields: name, email, phone).
- **Submit Inquiry/Application**: Form with:
  - Personal: Full name, email, primary/secondary phone, current address.
  - Preferences: Preferred contact method (phone/email/text), time.
  - Property: Type, budget range, preferred lot size, timeline (immediate/1-3 months/etc.), payment method (cash/financing/installment).
  - Additional requirements (textarea).
  - Submission updates property status to "UNDER_INQUIRY".
- **Inquiry Status**: Tenant views status (UNDER_INQUIRY, APPROVED, REJECTED) in property details.

### 3.3 Application Management (Admin)
- **List Applications**: Grid/table of inquiries with:
  - Filters: Status (all/pending/approved/rejected/owned), priority (high/medium/low).
  - Search by name/email/property.
  - Cards: Name, email, phone, property details, status badge, priority badge, submission date.
  - Actions: View details, approve (if pending), reject (if pending).
- **View Application Details**: Modal with all inquiry fields, property info, rejection reason (if rejected).
- **Approve Application**:
  - Opens plan selection modal.
  - Configure lease: Monthly payment (number), term (select: 6/12/18/24/36/48/60 months), interest rate (%).
  - Calculate: Total amount = monthly * term; features list.
  - On confirm: Update inquiry status to "closed" (approved), create lease, update property to "owned".
- **Reject Application**: Modal for rejection reason (required); update status to "rejected".
- **Clear Rejected**: Bulk delete all rejected inquiries with confirmation.

### 3.4 Lease and Payment Management
- **Set Lease Plan (Admin, during approval)**: Custom plan with name, duration, monthly rate, total, interest, features.
- **View Transactions (Admin)**: Table for leased properties: Property, amount, due date, status (PAID/PENDING/OVERDUE), actions (pay if not paid).
- **Tenant Payments**: Placeholder for monthly payments.
  - View lease details: Plan, terms (start/end date, deposit, late fees).
  - Pay button: Simulates payment, updates status to "PAID".
  - Overdue handling: Late fees (optional).

### 3.5 Data Models (Extracted from Interfaces)
- **Property**:
  - _id: string
  - title: string
  - location: string
  - size: string
  - price: number
  - type: "residential-lot" | "commercial" | "house-and-lot" | "condo"
  - status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED"
  - images: string[]
  - amenities: string[]
  - description: string
  - bedrooms/bathrooms/sqft: number (conditional)
  - owner: { fullName, email, phone, address, paymentStatus, paymentMethod }
  - inquiry: Inquiry
  - transactions: Transaction[]
- **Inquiry/Application**:
  - _id: string
  - propertyId: string
  - tenantId: string
  - reason: string
  - duration: string
  - status: "UNDER_INQUIRY" | "APPROVED" | "REJECTED"
  - rejectionReason: string
  - Additional fields from PropertyInquiry: fullName, phones, email, address, preferences, etc.
- **Transaction**:
  - _id: string
  - propertyId: string
  - tenantId: string
  - amount: number
  - dueDate: string
  - status: "PAID" | "PENDING" | "OVERDUE"
  - paymentDate: string
  - lateFee: number
- **Lease**:
  - _id: string
  - inquiryId: string
  - propertyId: string
  - leasePlan: { id, name, duration, monthlyRate, totalAmount, interestRate, features }
  - propertyDetails: Property subset
  - ownerDetails: Tenant info
  - leaseTerms: { startDate, endDate, securityDeposit, paymentDueDate, lateFeeAmount, gracePeriodDays }
  - status: "active" | "completed" | "terminated" | "pending"
  - paymentHistory: Array of payments

### 3.6 User Flows
- **Admin Creates Property**: Navigate to management page → Add Property → Fill form → Submit → List updates.
- **Tenant Applies**: View property → Fill inquiry form → Submit → Status updates.
- **Admin Approves**: View applications → Approve → Set plan → Confirm → Lease created.
- **Tenant Pays**: View leased property → See transactions → Pay overdue/pending.

## 4. Non-Functional Requirements
- **Performance**: Page loads < 2s; API responses < 500ms.
- **Security**: Authenticate all API calls; validate inputs to prevent XSS/SQL injection.
- **UI/UX**: Responsive design; use consistent icons/colors (e.g., status colors: green=approved, red=rejected).
- **Accessibility**: ARIA labels for icons/forms; keyboard navigation.
- **Error Handling**: Display user-friendly errors (e.g., "Failed to fetch properties"); loading spinners.
- **Scalability**: Support 100+ properties/inquiries with pagination.
- **Tech Stack**: React/Next.js frontend; Node.js/Express backend (assumed); MongoDB for data (inferred from IDs).

## 5. Risks and Mitigations
- **Risk**: Incomplete backend → Mitigation: Assume API exists; mock if needed.
- **Risk**: Payment security → Mitigation: Use simulated payments; integrate gateway later.
- **Risk**: Data inconsistencies (e.g., status mismatches) → Mitigation: Use transactions in backend.

## 6. Appendix
- **Wireframes**: Based on code (e.g., tables for lists, modals for details/forms).
- **Dependencies**: UI libs (Shadcn, Mantine, Lucide, Tabler icons); Axios for API.
- **Version History**: v1.0 - Initial PRD based on provided code (Sept 22, 2025).