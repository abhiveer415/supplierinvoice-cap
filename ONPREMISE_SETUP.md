# On-Premise SAP System Connection Setup

This guide helps you connect your CAP application in SAP BAS to your on-premise SAP S/4HANA system.

## Prerequisites

1. **SAP Cloud Connector** installed and running on your on-premise network
2. **SAP S/4HANA** system accessible from Cloud Connector
3. **SAP BTP Subaccount** with connectivity and destination services
4. **Network access** between Cloud Connector and SAP system

## Step 1: Configure SAP Cloud Connector

### Install Cloud Connector
1. Download SAP Cloud Connector from SAP Marketplace
2. Install on a machine with network access to your SAP system
3. Start Cloud Connector and login with your BTP credentials

### Configure Connection
1. **Access Control** → **Cloud To On-Premise**
2. Add new mapping for HMF_2023:
   ```
   Backend Type: SAP NetWeaver
   Virtual Host: mygohanafun2023
   Virtual Port: 8000
   Internal Host: <actual-hmf2023-host>
   Internal Port: 8000
   Protocol: HTTP
   Location ID: MYGO-BTP-BAS
   ```
3. **Principal Propagation**: Enable if needed
4. **Save and Start** the connection

## Step 2: Configure Destination in SAP BAS

### Create Destination
1. In SAP BAS, go to **Services** → **Destination Service**
2. Create new destination for HMF_2023:
   ```
   Name: API_SUPPLIERINVOICE_PROCESS_SRV
   Type: HTTP
   Description: Supplier Invoice Processing Service - HMF_2023
   URL: http://mygohanafun2023:8000/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/
   Proxy Type: OnPremise
   Authentication: BasicAuthentication
   User: <your-hmf2023-user>
   Password: <your-hmf2023-password>
   ```

### Additional Properties
```
WebIDEUsage: odata_abap
WebIDESystem: S4H
WebIDEAdditionalData: SystemName=HMF_2023;SystemType=OnPremise
SAP.CloudConnector.LocationId: MYGO-BTP-BAS
HTML5.DynamicDestination: true
HTML5.ForwardAuthToken: true
```

## Step 3: Update Application Configuration

### Update package.json
Replace `<your-onprem-system>` with your actual SAP host:
```json
{
  "cds": {
    "requires": {
      "API_SUPPLIERINVOICE_PROCESS_SRV": {
        "credentials": {
          "url": "https://your-actual-sap-host:44300",
          "authentication": "BasicAuthentication",
          "forwardAuthToken": true,
          "proxy": "sap-cloud-connectivity-proxy"
        }
      }
    }
  }
}
```

### Environment Variables
Set these in your deployment environment:
```
CDS_CONNECTIVITY_HOST=proxy.cf.sap.hana.ondemand.com
CDS_CONNECTIVITY_PORT=20003
```

## Step 4: Deploy and Test

### Deploy Application
```bash
# Build and deploy
mbt build
cf deploy mta_archives/supplierinvoice-cap_1.0.0.mtar
```

### Test Connection
```bash
# Test endpoint
curl -X GET "https://<your-space>.cfapps.<region>.hana.ondemand.com/odata/v4/supplier-invoice/SupplierInvoices" \
  -H "Authorization: Bearer <your-token>"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check Cloud Connector is running
   - Verify port mapping in Cloud Connector
   - Confirm SAP system is accessible

2. **Authentication Failed**
   - Verify user credentials in destination
   - Check SAP user has proper authorizations
   - Ensure SSL certificates are trusted

3. **Timeout Issues**
   - Check network latency
   - Increase timeout in destination settings
   - Verify firewall rules

4. **403 Forbidden**
   - Check XSUAA role assignments
   - Verify destination permissions
   - Confirm scope assignments

### Debug Commands
```bash
# Check connectivity service binding
cf env supplierinvoice-cap

# Check destination configuration
cf logs supplierinvoice-cap --recent

# Test network connectivity
telnet proxy.cf.sap.hana.ondemand.com 20003
```

## Security Considerations

1. **Network Security**
   - Use VPN for additional security
   - Restrict IP ranges in Cloud Connector
   - Monitor connection logs

2. **User Management**
   - Use dedicated service accounts
   - Implement principle of least privilege
   - Regular password rotation

3. **Monitoring**
   - Set up Cloud Connector monitoring
   - Monitor destination health
   - Track application logs

## Performance Optimization

1. **Connection Pooling**
   - Configure connection pool in destination
   - Use keep-alive settings
   - Optimize batch sizes

2. **Caching**
   - Enable OData response caching
   - Cache reference data locally
   - Use appropriate cache TTL

## Support

For additional help:
1. SAP Cloud Connector documentation
2. SAP BTP connectivity guide
3. SAP BAS community forums
4. SAP support portal
