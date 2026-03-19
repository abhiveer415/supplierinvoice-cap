using { API_SUPPLIERINVOICE_PROCESS_SRV as ext } 
  from './external/API_SUPPLIERINVOICE_PROCESS_SRV';

service SupplierInvoiceService {
  entity SupplierInvoices as projection on ext.A_SupplierInvoice;
  entity SupplierInvoiceItems as projection on ext.A_SuplrInvcItemPurOrdRef;
  entity SupplierInvoiceTax as projection on ext.A_SupplierInvoiceTax;
  entity SupplierInvoiceAdditionalData as projection on ext.A_SuplrInvoiceAdditionalData;
}
