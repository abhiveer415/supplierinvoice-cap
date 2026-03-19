using { API_SUPPLIERINVOICE_PROCESS_SRV } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Directly expose external service - no local entity definitions
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
