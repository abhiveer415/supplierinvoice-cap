const cds = require('@sap/cds')

module.exports = cds.service.impl(function () {
    const { SupplierInvoices, InvoiceItems, AccountAssignments } = this.entities

    // BEFORE CREATE - Validate supplier invoice data
    this.before('CREATE', SupplierInvoices, async (req) => {
        const invoice = req.data
        
        // Business Rule: Invoice gross amount must be positive
        if (invoice.InvoiceGrossAmount <= 0) {
            req.reject(400, 'Invoice gross amount must be greater than 0')
        }
        
        // Business Rule: Required fields validation
        if (!invoice.CompanyCode) {
            req.reject(400, 'Company Code is required')
        }
        
        if (!invoice.DocumentCurrency) {
            req.reject(400, 'Document Currency is required')
        }
        
        // Business Rule: Posting date cannot be in the future
        if (new Date(invoice.PostingDate) > new Date()) {
            req.reject(400, 'Posting date cannot be in the future')
        }
        
        console.log(`Validating supplier invoice: ${invoice.SupplierInvoice}`)
    })

    // BEFORE UPDATE - Additional validations for updates
    this.before('UPDATE', SupplierInvoices, async (req) => {
        const invoice = req.data
        
        // Business Rule: Cannot change SupplierInvoice or FiscalYear
        if (invoice.SupplierInvoice || invoice.FiscalYear) {
            req.reject(400, 'Cannot change SupplierInvoice or FiscalYear fields')
        }
        
        // Business Rule: Check if invoice is already posted
        const existing = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice: req.params[0].SupplierInvoice, 
                    FiscalYear: req.params[0].FiscalYear })
        
        if (existing && existing.SupplierInvoiceStatus === '5') { // Posted status
            req.reject(400, 'Cannot modify posted invoice')
        }
    })

    // BEFORE CREATE - Validate invoice items
    this.before('CREATE', InvoiceItems, async (req) => {
        const item = req.data
        
        // Business Rule: Item amount must be positive
        if (item.SupplierInvoiceItemAmount <= 0) {
            req.reject(400, 'Invoice item amount must be greater than 0')
        }
        
        // Business Rule: Tax code is required
        if (!item.TaxCode) {
            req.reject(400, 'Tax code is required for invoice items')
        }
        
        console.log(`Validating invoice item: ${item.SupplierInvoice}-${item.SupplierInvoiceItem}`)
    })

    // BEFORE READ - Authorization and access control for supplier invoices
    this.before('READ', SupplierInvoices, async (req) => {
        // Business Rule: Log access attempts for audit
        const user = req.user?.id || 'anonymous'
        console.log(`User ${user} accessing SupplierInvoices`)
        
        // Business Rule: Restrict access based on user roles (example)
        if (req.user && !req.user.has('finance_role') && !req.user.has('admin_role')) {
            // For demo purposes, we'll just log but not restrict
            // In production, you might want to restrict to certain company codes
            console.log(`User ${user} has limited access to invoices`)
        }
        
        // Business Rule: Apply default filters if none specified
        if (!req.query.SELECT.where && req.user) {
            // Only show invoices from last 2 years for non-admin users
            if (!req.user.has('admin_role')) {
                const twoYearsAgo = new Date()
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
                req.query.where(`PostingDate >= ${twoYearsAgo.toISOString()}`)
            }
        }
    })

    // BEFORE READ - Authorization for invoice items
    this.before('READ', InvoiceItems, async (req) => {
        const user = req.user?.id || 'anonymous'
        console.log(`User ${user} accessing InvoiceItems`)
        
        // Business Rule: Cannot access items for invoices they don't have access to
        // This is handled automatically by CAP through associations
    })

    // BEFORE READ - Authorization for account assignments
    this.before('READ', AccountAssignments, async (req) => {
        const user = req.user?.id || 'anonymous'
        console.log(`User ${user} accessing AccountAssignments`)
        
        // Business Rule: Sensitive financial data - require special access
        if (req.user && !req.user.has('finance_role') && !req.user.has('admin_role')) {
            req.reject(403, 'Insufficient privileges to access account assignments')
        }
    })

    // ON READ - Add computed fields and enrich data
    this.on('READ', SupplierInvoices, async (req, next) => {
        // Let the external service handle the read first
        const result = await next(req)
        
        // Business Logic: Add computed fields
        if (Array.isArray(result)) {
            result.forEach(invoice => {
                // Add computed field: Days since posting
                if (invoice.PostingDate) {
                    const postingDate = new Date(invoice.PostingDate)
                    const today = new Date()
                    invoice.DaysSincePosting = Math.floor((today - postingDate) / (1000 * 60 * 60 * 24))
                }
                
                // Add computed field: Status description
                const statusMap = {
                    '1': 'Draft',
                    '2': 'Held', 
                    '3': 'Parkd',
                    '4': 'Blocked',
                    '5': 'Posted',
                    '6': 'Reversed'
                }
                invoice.StatusDescription = statusMap[invoice.SupplierInvoiceStatus] || 'Unknown'
            })
        } else if (result) {
            // Single record case
            if (result.PostingDate) {
                const postingDate = new Date(result.PostingDate)
                const today = new Date()
                result.DaysSincePosting = Math.floor((today - postingDate) / (1000 * 60 * 60 * 24))
            }
            
            const statusMap = {
                '1': 'Draft',
                '2': 'Held', 
                '3': 'Parkd',
                '4': 'Blocked',
                '5': 'Posted',
                '6': 'Reversed'
            }
            result.StatusDescription = statusMap[result.SupplierInvoiceStatus] || 'Unknown'
        }
        
        return result
    })

    // ON READ - Enrich invoice items with computed values
    this.on('READ', InvoiceItems, async (req, next) => {
        const result = await next(req)
        
        // Business Logic: Add computed fields for items
        if (Array.isArray(result)) {
            result.forEach(item => {
                // Add computed field: Tax amount calculation (if not provided)
                if (item.SupplierInvoiceItemAmount && !item.TaxAmount) {
                    // Simplified tax calculation - in real scenario, this would be more complex
                    item.EstimatedTaxAmount = item.SupplierInvoiceItemAmount * 0.19 // 19% VAT example
                }
            })
        }
        
        return result
    })

    // BEFORE DELETE - Validate and control deletion of supplier invoices
    this.before('DELETE', SupplierInvoices, async (req) => {
        const { SupplierInvoice, FiscalYear } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        console.log(`User ${user} attempting to delete invoice ${SupplierInvoice}-${FiscalYear}`)
        
        // Business Rule: Only admins can delete invoices
        if (!req.user || (!req.user.has('admin_role') && !req.user.has('finance_manager_role'))) {
            req.reject(403, 'Only administrators or finance managers can delete invoices')
        }
        
        // Business Rule: Check if invoice exists and get its status
        const invoice = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice, FiscalYear })
        
        if (!invoice) {
            req.reject(404, 'Invoice not found')
        }
        
        // Business Rule: Cannot delete posted invoices
        if (invoice.SupplierInvoiceStatus === '5') { // Posted status
            req.reject(400, 'Cannot delete posted invoice. Use reversal instead.')
        }
        
        // Business Rule: Cannot delete invoices older than 1 year (unless admin)
        if (invoice.PostingDate) {
            const postingDate = new Date(invoice.PostingDate)
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
            
            if (postingDate < oneYearAgo && !req.user.has('admin_role')) {
                req.reject(400, 'Cannot delete invoices older than 1 year')
            }
        }
        
        // Business Rule: Check if invoice has related items that would be affected
        const relatedItems = await SELECT.from(InvoiceItems)
            .where({ SupplierInvoice, FiscalYear })
        
        if (relatedItems.length > 0) {
            console.log(`Warning: Deleting invoice will affect ${relatedItems.length} related items`)
        }
    })

    // BEFORE DELETE - Validate deletion of invoice items
    this.before('DELETE', InvoiceItems, async (req) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        console.log(`User ${user} attempting to delete invoice item ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}`)
        
        // Business Rule: Only finance users can delete items
        if (!req.user || (!req.user.has('finance_role') && !req.user.has('admin_role'))) {
            req.reject(403, 'Only finance users or administrators can delete invoice items')
        }
        
        // Business Rule: Check if parent invoice allows item deletion
        const invoice = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice, FiscalYear })
        
        if (!invoice) {
            req.reject(404, 'Parent invoice not found')
        }
        
        // Business Rule: Cannot delete items from posted invoices
        if (invoice.SupplierInvoiceStatus === '5') { // Posted status
            req.reject(400, 'Cannot delete items from posted invoice')
        }
        
        // Business Rule: Check if item has account assignments
        const accountAssignments = await SELECT.from(AccountAssignments)
            .where({ SupplierInvoice, FiscalYear, SupplierInvoiceItem })
        
        if (accountAssignments.length > 0) {
            req.reject(400, 'Cannot delete item with existing account assignments')
        }
    })

    // BEFORE DELETE - Validate deletion of account assignments
    this.before('DELETE', AccountAssignments, async (req) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem, OrdinalNumber } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        console.log(`User ${user} attempting to delete account assignment ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}-${OrdinalNumber}`)
        
        // Business Rule: Only finance users can delete account assignments
        if (!req.user || (!req.user.has('finance_role') && !req.user.has('admin_role'))) {
            req.reject(403, 'Only finance users or administrators can delete account assignments')
        }
        
        // Business Rule: Check if parent invoice allows deletion
        const invoice = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice, FiscalYear })
        
        if (!invoice) {
            req.reject(404, 'Parent invoice not found')
        }
        
        // Business Rule: Cannot delete assignments from posted invoices
        if (invoice.SupplierInvoiceStatus === '5') { // Posted status
            req.reject(400, 'Cannot delete account assignments from posted invoice')
        }
    })

    // ON DELETE - Audit logging and cleanup
    this.on('DELETE', SupplierInvoices, async (req, next) => {
        const { SupplierInvoice, FiscalYear } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Get invoice data before deletion for audit
        const invoiceToDelete = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice, FiscalYear })
        
        // Perform the deletion
        const result = await next(req)
        
        // Business Logic: Audit logging
        console.log(`Invoice ${SupplierInvoice}-${FiscalYear} deleted by user ${user}`)
        console.log(`Deleted invoice data:`, {
            CompanyCode: invoiceToDelete.CompanyCode,
            InvoiceGrossAmount: invoiceToDelete.InvoiceGrossAmount,
            DocumentCurrency: invoiceToDelete.DocumentCurrency,
            Status: invoiceToDelete.SupplierInvoiceStatus
        })
        
        // Business Logic: Send notification for audit trail
        // await sendDeletionNotification(invoiceToDelete, user)
        
        return result
    })

    // ON DELETE - Audit logging for invoice items
    this.on('DELETE', InvoiceItems, async (req, next) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Get item data before deletion
        const itemToDelete = await SELECT.one.from(InvoiceItems)
            .where({ SupplierInvoice, FiscalYear, SupplierInvoiceItem })
        
        // Perform the deletion
        const result = await next(req)
        
        // Business Logic: Audit logging
        console.log(`Invoice item ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem} deleted by user ${user}`)
        console.log(`Deleted item amount: ${itemToDelete.SupplierInvoiceItemAmount} ${itemToDelete.DocumentCurrency}`)
        
        return result
    })

    // ON DELETE - Audit logging for account assignments
    this.on('DELETE', AccountAssignments, async (req, next) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem, OrdinalNumber } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Get assignment data before deletion
        const assignmentToDelete = await SELECT.one.from(AccountAssignments)
            .where({ SupplierInvoice, FiscalYear, SupplierInvoiceItem, OrdinalNumber })
        
        // Perform the deletion
        const result = await next(req)
        
        // Business Logic: Audit logging
        console.log(`Account assignment ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}-${OrdinalNumber} deleted by user ${user}`)
        console.log(`Deleted assignment: GLAccount ${assignmentToDelete.GLAccount}, Amount ${assignmentToDelete.SuplrInvcAcctAssignmentAmount}`)
        
        return result
    })

    // ON CREATE - Additional business logic after creation
    this.on('CREATE', SupplierInvoices, async (req, next) => {
        // Let the external service handle the creation first
        const result = await next(req)
        
        // Business Logic: Log successful creation
        console.log(`Supplier invoice ${result.SupplierInvoice} created successfully`)
        
        // Business Logic: Send notification (example)
        // await sendNotificationToFinanceTeam(result)
        
        return result
    })

    // Custom Action - Validate complete invoice
    this.on('validateInvoice', async (req) => {
        const { SupplierInvoice, FiscalYear } = req.data
        
        // Get invoice with all related data
        const invoice = await SELECT.one.from(SupplierInvoices)
            .where({ SupplierInvoice, FiscalYear })
            .expand(to_SuplrInvcItemPurOrdRef(
                to_SupplierInvoiceItmAcctAssgmt
            ))
        
        if (!invoice) {
            return { status: 'ERROR', message: 'Invoice not found' }
        }
        
        // Business Logic: Validate invoice completeness
        const validations = []
        
        if (!invoice.to_SuplrInvcItemPurOrdRef || invoice.to_SuplrInvcItemPurOrdRef.length === 0) {
            validations.push('Invoice has no items')
        }
        
        // Check if all items have account assignments
        for (const item of invoice.to_SuplrInvcItemPurOrdRef || []) {
            if (!item.to_SupplierInvoiceItmAcctAssgmt || item.to_SupplierInvoiceItmAcctAssgmt.length === 0) {
                validations.push(`Item ${item.SupplierInvoiceItem} has no account assignment`)
            }
        }
        
        return {
            status: validations.length > 0 ? 'WARNING' : 'SUCCESS',
            message: validations.length > 0 ? validations.join('; ') : 'Invoice is complete',
            invoice
        }
    })

    console.log('Supplier Invoice Processing Service with business logic started')
})
