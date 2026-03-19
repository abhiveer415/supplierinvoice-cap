using { API_SUPPLIERINVOICE_PROCESS_SRV } from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
    // Directly expose external service entities - no local definitions
    @cds.external entity SupplierInvoices as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SupplierInvoice;
    @cds.external entity InvoiceItems as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SuplrInvcItemPurOrdRef;
    @cds.external entity AccountAssignments as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SuplrInvcItemAcctAssgmt;
    @cds.external entity TaxItems as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SupplierInvoiceTax;
    @cds.external entity WithholdingTaxItems as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SuplrInvcHeaderWhldgTax;
    @cds.external entity AdditionalData as projection on API_SUPPLIERINVOICE_PROCESS_SRV.A_SuplrInvoiceAdditionalData;
    
    // Custom action for invoice validation
    action validateInvoice(SupplierInvoice: String, FiscalYear: String) returns String;
}
