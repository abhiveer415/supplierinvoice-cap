using { API_SUPPLIERINVOICE_PROCESS_SRV as external } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Expose external service entities as proxy
    @readonly entity SupplierInvoices as projection on external.A_SupplierInvoice;
    @readonly entity InvoiceItems as projection on external.A_SuplrInvcItemPurOrdRef;
    @readonly entity AccountAssignments as projection on external.A_SuplrInvcItemAcctAssgmt;
    @readonly entity TaxItems as projection on external.A_SupplierInvoiceTax;
    @readonly entity WithholdingTaxItems as projection on external.A_SuplrInvcHeaderWhldgTax;
    @readonly entity AdditionalData as projection on external.A_SuplrInvoiceAdditionalData;
    
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
