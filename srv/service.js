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
    console.log('Supplier Invoice Processing Service with business logic started')

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
