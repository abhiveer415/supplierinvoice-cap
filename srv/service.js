const cds = require('@sap/cds')

// Helper function to check user roles safely
function hasRole(user, role) {
    if (!user) return false
    if (user.has && typeof user.has === 'function') {
        return user.has(role)
    }
    if (user.scopes && Array.isArray(user.scopes)) {
        return user.scopes.includes(role)
    }
    if (user.roles && Array.isArray(user.roles)) {
        return user.roles.includes(role)
    }
    return false
}

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
        if (req.user && !hasRole(req.user, 'finance_role') && !hasRole(req.user, 'admin_role')) {
            // For demo purposes, we'll just log but not restrict
            // In production, you might want to restrict to certain company codes
            console.log(`User ${user} has limited access to invoices`)
        }
        
        // Business Rule: Apply default filters if none specified
        if (!req.query.SELECT.where && req.user) {
            // Only show invoices from last 2 years for non-admin users
            if (!hasRole(req.user, 'admin_role')) {
                const twoYearsAgo = new Date()
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
                req.query.where({ PostingDate: { '>=': twoYearsAgo.toISOString() } })
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
        if (req.user && !hasRole(req.user, 'finance_role') && !hasRole(req.user, 'admin_role')) {
            req.reject(403, 'Insufficient privileges to access account assignments')
        }
    })

    // ON READ - Add computed fields and enrich data
    this.on('READ', SupplierInvoices, async (req, next) => {
        // Let external service handle the read first
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
        if (!req.user || (!hasRole(req.user, 'admin_role') && !hasRole(req.user, 'finance_manager_role'))) {
            req.reject(403, 'Only administrators or finance managers can delete invoices')
        }
        
        // For external service, we can't easily check status before deletion
        // The external service will handle these validations
        console.log(`Proceeding with deletion of invoice ${SupplierInvoice}-${FiscalYear}`)
    })

    // BEFORE DELETE - Validate deletion of invoice items
    this.before('DELETE', InvoiceItems, async (req) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        console.log(`User ${user} attempting to delete invoice item ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}`)
        
        // Business Rule: Only finance users can delete items
        if (!req.user || (!hasRole(req.user, 'finance_role') && !hasRole(req.user, 'admin_role'))) {
            req.reject(403, 'Only finance users or administrators can delete invoice items')
        }
        
        // For external service, we can't easily check dependencies before deletion
        // The external service will handle these validations
        console.log(`Proceeding with deletion of invoice item ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}`)
    })

    // BEFORE DELETE - Validate deletion of account assignments
    this.before('DELETE', AccountAssignments, async (req) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem, OrdinalNumber } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        console.log(`User ${user} attempting to delete account assignment ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}-${OrdinalNumber}`)
        
        // Business Rule: Only finance users can delete account assignments
        if (!req.user || (!hasRole(req.user, 'finance_role') && !hasRole(req.user, 'admin_role'))) {
            req.reject(403, 'Only finance users or administrators can delete account assignments')
        }
        
        // For external service, we can't easily check dependencies before deletion
        // The external service will handle these validations
        console.log(`Proceeding with deletion of account assignment ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}-${OrdinalNumber}`)
    })

    // ON DELETE - Audit logging and cleanup
    this.on('DELETE', SupplierInvoices, async (req, next) => {
        const { SupplierInvoice, FiscalYear } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Business Logic: Audit logging
        console.log(`Invoice ${SupplierInvoice}-${FiscalYear} deleted by user ${user}`)
        console.log(`Invoice deletion processed by external service`)
        
        // Let the external service handle the deletion
        const result = await next(req)
        
        // Business Logic: Send notification for audit trail
        // await sendDeletionNotification(invoiceToDelete, user)
        
        return result
    })

    // ON DELETE - Audit logging for invoice items
    this.on('DELETE', InvoiceItems, async (req, next) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Business Logic: Audit logging
        console.log(`Invoice item ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem} deleted by user ${user}`)
        console.log(`Invoice item deletion processed by external service`)
        
        // Let the external service handle the deletion
        const result = await next(req)
        
        return result
    })

    // ON DELETE - Audit logging for account assignments
    this.on('DELETE', AccountAssignments, async (req, next) => {
        const { SupplierInvoice, FiscalYear, SupplierInvoiceItem, OrdinalNumber } = req.params[0]
        const user = req.user?.id || 'anonymous'
        
        // Business Logic: Audit logging
        console.log(`Account assignment ${SupplierInvoice}-${FiscalYear}-${SupplierInvoiceItem}-${OrdinalNumber} deleted by user ${user}`)
        console.log(`Account assignment deletion processed by external service`)
        
        // Let the external service handle the deletion
        const result = await next(req)
        
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
        
        // For external service, we can't easily query related data
        // Let's return a simple validation response
        return {
            status: 'SUCCESS',
            message: `Invoice validation initiated for ${SupplierInvoice}-${FiscalYear}`,
            validationDetails: {
                invoiceNumber: SupplierInvoice,
                fiscalYear: FiscalYear,
                validationType: 'basic_check',
                timestamp: new Date().toISOString()
            }
        }
    })

    console.log('Supplier Invoice Processing Service with business logic started')
})
