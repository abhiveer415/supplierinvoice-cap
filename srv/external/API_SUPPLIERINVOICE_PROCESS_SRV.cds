@cds.external
service API_SUPPLIERINVOICE_PROCESS_SRV {
    
    // Main Supplier Invoice Entity
    entity A_SupplierInvoice {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        CompanyCode : String(4);
        DocumentDate : DateTime;
        PostingDate : DateTime;
        CreationDate : DateTime;
        SupplierInvoiceIDByInvcgParty : String(16);
        InvoicingParty : String(10);
        DocumentCurrency : String(5);
        InvoiceGrossAmount : Decimal(14,3);
        UnplannedDeliveryCost : Decimal(14,3);
        DocumentHeaderText : String(25);
        PaymentTerms : String(4);
        SupplierInvoiceStatus : String(1);
        IsReversal : Boolean;
        IsReversed : Boolean;
        
        // Navigation properties
        to_SelectedDeliveryNotes : Association to many A_SuplrInvcSeldInbDeliveryNote 
            on to_SelectedDeliveryNotes.SupplierInvoice = SupplierInvoice 
           and to_SelectedDeliveryNotes.FiscalYear = FiscalYear;
        to_SelectedPurchaseOrders : Association to many A_SuplrInvcSeldPurgDocument 
            on to_SelectedPurchaseOrders.SupplierInvoice = SupplierInvoice 
           and to_SelectedPurchaseOrders.FiscalYear = FiscalYear;
        to_SelectedServiceEntrySheets : Association to many A_SuplrInvcSeldSrvcEntrShtLean 
            on to_SelectedServiceEntrySheets.SupplierInvoice = SupplierInvoice 
           and to_SelectedServiceEntrySheets.FiscalYear = FiscalYear;
        to_SuplrInvcItemAsset : Association to many A_SupplierInvoiceItemAsset 
            on to_SuplrInvcItemAsset.SupplierInvoice = SupplierInvoice 
           and to_SuplrInvcItemAsset.FiscalYear = FiscalYear;
        to_SuplrInvcItemMaterial : Association to many A_SupplierInvoiceItemMaterial 
            on to_SuplrInvcItemMaterial.SupplierInvoice = SupplierInvoice 
           and to_SuplrInvcItemMaterial.FiscalYear = FiscalYear;
        to_SuplrInvcItemPurOrdRef : Association to many A_SuplrInvcItemPurOrdRef 
            on to_SuplrInvcItemPurOrdRef.SupplierInvoice = SupplierInvoice 
           and to_SuplrInvcItemPurOrdRef.FiscalYear = FiscalYear;
        to_SuplrInvoiceAdditionalData : Association to one A_SuplrInvoiceAdditionalData 
            on to_SuplrInvoiceAdditionalData.SupplierInvoice = SupplierInvoice 
           and to_SuplrInvoiceAdditionalData.FiscalYear = FiscalYear;
        to_SupplierInvoiceItemGLAcct : Association to many A_SupplierInvoiceItemGLAcct 
            on to_SupplierInvoiceItemGLAcct.SupplierInvoice = SupplierInvoice 
           and to_SupplierInvoiceItemGLAcct.FiscalYear = FiscalYear;
        to_SupplierInvoiceTax : Association to many A_SupplierInvoiceTax 
            on to_SupplierInvoiceTax.SupplierInvoice = SupplierInvoice 
           and to_SupplierInvoiceTax.FiscalYear = FiscalYear;
        to_SupplierInvoiceWhldgTax : Association to many A_SuplrInvcHeaderWhldgTax 
            on to_SupplierInvoiceWhldgTax.SupplierInvoice = SupplierInvoice 
           and to_SupplierInvoiceWhldgTax.FiscalYear = FiscalYear;
    };

    // Supplier Invoice Items with Purchase Order Reference
    entity A_SuplrInvcItemPurOrdRef {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key SupplierInvoiceItem : String(6);
        PurchaseOrder : String(10);
        PurchaseOrderItem : String(5);
        Plant : String(4);
        TaxCode : String(2);
        DocumentCurrency : String(5);
        SupplierInvoiceItemAmount : Decimal(14,3);
        SupplierInvoiceItemText : String(50);
        IsFinallyInvoiced : Boolean;
        TaxDeterminationDate : DateTime;
        
        // Navigation to Account Assignments
        to_SupplierInvoiceItmAcctAssgmt : Association to many A_SuplrInvcItemAcctAssgmt 
            on to_SupplierInvoiceItmAcctAssgmt.SupplierInvoice = SupplierInvoice 
           and to_SupplierInvoiceItmAcctAssgmt.FiscalYear = FiscalYear 
           and to_SupplierInvoiceItmAcctAssgmt.SupplierInvoiceItem = SupplierInvoiceItem;
    };

    // Account Assignment Data
    entity A_SuplrInvcItemAcctAssgmt {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key SupplierInvoiceItem : String(6);
        key OrdinalNumber : String(4);
        CostCenter : String(10);
        GLAccount : String(10);
        ProfitCenter : String(10);
        DocumentCurrency : String(5);
        SuplrInvcAcctAssignmentAmount : Decimal(14,3);
        TaxCode : String(2);
        WBSElement : String(24);
    };

    // Material Items
    entity A_SupplierInvoiceItemMaterial {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key SupplierInvoiceItem : String(6);
        Material : String(40);
        Plant : String(4);
        DocumentCurrency : String(5);
        SupplierInvoiceItemAmount : Decimal(14,3);
        Quantity : Decimal(13,3);
        TaxCode : String(2);
        ValuationArea : String(4);
    };

    // G/L Account Items
    entity A_SupplierInvoiceItemGLAcct {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key SupplierInvoiceItem : String(6);
        GLAccount : String(10);
        DocumentCurrency : String(5);
        SupplierInvoiceItemAmount : Decimal(14,3);
        TaxCode : String(2);
    };

    // Asset Items
    entity A_SupplierInvoiceItemAsset {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key SupplierInvoiceItem : String(6);
        MasterFixedAsset : String(12);
        FixedAsset : String(4);
        DocumentCurrency : String(5);
        SupplierInvoiceItemAmount : Decimal(14,3);
    };

    // Tax Data
    entity A_SupplierInvoiceTax {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key TaxCode : String(2);
        key SupplierInvoiceTaxCounter : String(3);
        DocumentCurrency : String(5);
        TaxAmount : Decimal(14,3);
    };

    // Withholding Tax Data
    entity A_SuplrInvcHeaderWhldgTax {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key WithholdingTaxType : String(2);
        DocumentCurrency : String(5);
        WithholdingTaxCode : String(2);
        WithholdingTaxBaseAmount : Decimal(16,3);
        ManuallyEnteredWhldgTaxAmount : Decimal(16,3);
    };

    // Additional Data
    entity A_SuplrInvoiceAdditionalData {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        InvoicingPartyName1 : String(35);
        CityName : String(35);
        Country : String(3);
        StreetAddressName : String(35);
        PostalCode : String(10);
        TaxID1 : String(16);
        VATRegistration : String(20);
        IBAN : String(34);
        SWIFTCode : String(11);
    };

    // Selected Delivery Notes
    entity A_SuplrInvcSeldInbDeliveryNote {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key InboundDeliveryNote : String(16);
    };

    // Selected Purchase Orders
    entity A_SuplrInvcSeldPurgDocument {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key PurchaseOrder : String(10);
        key PurchaseOrderItem : String(5);
    };

    // Selected Service Entry Sheets
    entity A_SuplrInvcSeldSrvcEntrShtLean {
        key SupplierInvoice : String(10);
        key FiscalYear : String(4);
        key ServiceEntrySheet : String(10);
        key ServiceEntrySheetItem : String(5);
    };

    // Function Imports
    function Post(SupplierInvoice: String, FiscalYear: String) returns Boolean;
    function Release(SupplierInvoice: String, FiscalYear: String, DiscountDaysHaveToBeShifted: Boolean) returns Boolean;
    function Cancel(SupplierInvoice: String, FiscalYear: String, PostingDate: DateTime, ReversalReason: String) returns Boolean;
}
