# Supplier Invoice Processing CAP Application

A SAP CAP application that provides a full CRUD proxy for the API_SUPPLIERINVOICE_PROCESS_SRV external service with comprehensive business logic and validations.

## Features

- **External Service Proxy**: Complete proxy for SAP Supplier Invoice Processing API
- **Business Logic**: Comprehensive validations for all CRUD operations
- **Role-Based Security**: Multi-level authorization and access control
- **Audit Trail**: Complete logging for all data modifications
- **Navigation Properties**: Full relationship support between entities
- **Custom Actions**: Domain-specific operations like invoice validation

## Prerequisites

- SAP CAP 7.9.0 or higher
- Node.js 20.x
- Access to SAP S/4HANA system with API_SUPPLIERINVOICE_PROCESS_SRV
- SAP Business Application Studio (BAS) for deployment

## Deployment to SAP BAS

### 1. Prepare Project
```bash
# Clone project to BAS
git clone <repository-url>
cd supplierinvoice-cap

# Install dependencies
npm install
```

### 2. Configure Destination
1. In BAS, go to **Service Bindings** → **Destination Service**
2. Create destination named `API_SUPPLIERINVOICE_PROCESS_SRV`
3. Configure:
   - **URL**: Your S/4HANA system URL + `/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/`
   - **Authentication**: OAuth2UserTokenExchange
   - **Type**: HTTP
   - **ProxyType**: Internet

### 3. Deploy Application
```bash
# Build MTA project
mbt build

# Deploy to Cloud Foundry
cf deploy mta_archives/supplierinvoice-cap_1.0.0.mtar
```

### 4. Assign Roles
After deployment, assign user roles:
- **Viewer**: Read-only access
- **Editor**: Read and write access
- **Finance_User**: Finance department access
- **Finance_Manager**: Finance management with delete rights
- **Admin**: Full administrative access

## API Endpoints

After deployment, the service will be available at:
```
https://<your-space>.cfapps.<region>.hana.ondemand.com/odata/v4/supplier-invoice
```

### Main Entities
- `SupplierInvoices` - Main invoice headers
- `InvoiceItems` - Invoice line items
- `AccountAssignments` - Financial account assignments
- `TaxItems` - Tax information
- `WithholdingTaxItems` - Withholding tax data
- `AdditionalData` - Additional invoice information

### Custom Actions
- `validateInvoice` - Complete invoice validation

## Business Logic

### Validations
- **CREATE**: Positive amounts, required fields, future date prevention
- **UPDATE**: Key field protection, posted invoice restrictions
- **DELETE**: Role-based deletion, dependency protection, audit logging
- **READ**: Role-based filtering, computed fields, audit logging

### Security
- Multi-level role-based access control
- Company code and cost center restrictions
- Audit trail for all modifications
- Sensitive data protection

## Development

### Local Development
```bash
# Start local server
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

### Testing
```bash
# Test endpoints
curl -X GET "http://localhost:4004/odata/v4/supplier-invoice/SupplierInvoices"

# Test custom action
curl -X POST "http://localhost:4004/odata/v4/supplier-invoice/validateInvoice" \
  -H "Content-Type: application/json" \
  -d '{"SupplierInvoice":"12345","FiscalYear":"2024"}'
```

## Support

For issues and questions:
1. Check the BAS logs for deployment issues
2. Verify destination configuration
3. Review user role assignments
4. Check S/4HANA system connectivity

## License

This project is part of the supplier invoice processing solution.
