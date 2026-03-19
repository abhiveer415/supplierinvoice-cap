using { API_SUPPLIERINVOICE_PROCESS_SRV as external } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Expose external service entities as proxy - no local database
    @cds.persistence.skip entity SupplierInvoices as projection on external.A_SupplierInvoice;
    @cds.persistence.skip entity InvoiceItems as projection on external.A_SuplrInvcItemPurOrdRef;
    @cds.persistence.skip entity AccountAssignments as projection on external.A_SuplrInvcItemAcctAssgmt;
    @cds.persistence.skip entity TaxItems as projection on external.A_SupplierInvoiceTax;
    @cds.persistence.skip entity WithholdingTaxItems as projection on external.A_SuplrInvcHeaderWhldgTax;
    @cds.persistence.skip entity AdditionalData as projection on external.A_SuplrInvoiceAdditionalData;
    
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
