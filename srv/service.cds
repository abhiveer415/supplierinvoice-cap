using { API_SUPPLIERINVOICE_PROCESS_SRV as external } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Expose external service entities as proxy
    entity SupplierInvoices as projection on external.A_SupplierInvoice;
    entity InvoiceItems as projection on external.A_SuplrInvcItemPurOrdRef;
    entity AccountAssignments as projection on external.A_SuplrInvcItemAcctAssgmt;
    entity TaxItems as projection on external.A_SupplierInvoiceTax;
    entity WithholdingTaxItems as projection on external.A_SuplrInvcHeaderWhldgTax;
    entity AdditionalData as projection on external.A_SuplrInvoiceAdditionalData;
    
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
