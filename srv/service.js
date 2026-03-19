const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const remote = await cds.connect.to('supplierinvoiceprocess');

    // Generic full proxy for all entities
    this.on('*', async (req) => {
        return remote.tx(req).run(req.query);
    });

});
