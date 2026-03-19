using { API_SUPPLIERINVOICE_PROCESS_SRV as external } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Expose external service entities as proxy
    @cds.external entity SupplierInvoices as projection on external.A_SupplierInvoice;
    @cds.external entity InvoiceItems as projection on external.A_SuplrInvcItemPurOrdRef;
    @cds.external entity AccountAssignments as projection on external.A_SuplrInvcItemAcctAssgmt;
    @cds.external entity TaxItems as projection on external.A_SupplierInvoiceTax;
    @cds.external entity WithholdingTaxItems as projection on external.A_SuplrInvcHeaderWhldgTax;
    @cds.external entity AdditionalData as projection on external.A_SuplrInvoiceAdditionalData;
    
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
