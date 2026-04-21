# Scripting Across Multiple Tables in NocoDB

**Date:** 2025-12-25
**System:** NocoDB Scripts
**Use Case:** Linking emailAccess records to Organizations based on email domain

## The Problem

When users submit their email for temporary access, we capture it in the `emailAccess` table. We want to automatically:

1. Extract the domain from the email (e.g., `john@acme.com` → `acme.com`)
2. Check if an Organization exists with that domain
3. If found → link the emailAccess record to that Organization
4. If not found → create a new Organization with minimal fields, then link

## Prerequisites

Before running the script:

1. **Create a Link field** in your `emailAccess` table
   - Name it `Organization` (or update `linkFieldName` in the script)
   - Link type: Link to Another Record
   - Target table: `organizations`

2. **Table IDs for reference:**
   - `emailAccess`: `ms0dzr6telg2cxu`
   - `organizations`: `myxl4ug85sr1d4p`

## NocoDB Scripts API Reference

### Key Methods Used

| Method | Purpose |
|--------|---------|
| `base.getTable('name')` | Get table by name or ID |
| `table.selectRecordsAsync(options)` | Query records with pagination |
| `table.createRecordAsync(fields)` | Create single record |
| `table.updateRecordAsync(id, fields)` | Update single record |
| `record.getCellValue('field')` | Get field value from record |
| `record.getCellValueAsString('field')` | Get field value as string |
| `table.getField('name')` | Get field object by name |

### Linking Records Syntax

To link records between tables, use the field ID and pass an array of record IDs:

```javascript
await sourceTable.updateRecordAsync(recordId, {
  [linkField.id]: [{ id: targetRecordId }]
});
```

To unlink, pass an empty array:

```javascript
await sourceTable.updateRecordAsync(recordId, {
  [linkField.id]: []
});
```

## The Script

Paste this into NocoDB Scripts UI:

```javascript
/**
 * Email to Organization Linker
 *
 * For each email in emailAccess table:
 * 1. Extract domain from email
 * 2. Check if Organization exists with matching url/domain
 * 3. If found → link emailAccess to that Organization
 * 4. If not found → create new Organization, then link
 */

// Get tables
const emailAccessTable = base.getTable('emailAccess');
const organizationsTable = base.getTable('organizations');

// Get the link field in emailAccess that points to Organizations
// CHANGE THIS to match your actual link field name
const linkFieldName = 'Organization';

// Fetch all organizations and index by domain
output.text('Fetching organizations...');
let orgsQuery = await organizationsTable.selectRecordsAsync({
  fields: ['conventionalName', 'url'],
  pageSize: 100
});

// Build a map of domain → organization record
const orgsByDomain = new Map();

function extractDomainFromUrl(url) {
  if (!url) return null;
  // Remove protocol and www, get just the domain
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

function indexOrgs(records) {
  for (let record of records) {
    const url = record.getCellValueAsString('url');
    const domain = extractDomainFromUrl(url);
    if (domain) {
      orgsByDomain.set(domain, record);
    }
  }
}

indexOrgs(orgsQuery.records);
while (orgsQuery.hasMoreRecords) {
  await orgsQuery.loadMoreRecords();
  indexOrgs(orgsQuery.records.slice(-100));
}

output.text(`Indexed ${orgsByDomain.size} organizations by domain`);

// Fetch all emailAccess records
output.text('Fetching email access records...');
let emailQuery = await emailAccessTable.selectRecordsAsync({
  fields: ['emailOfAccessor', linkFieldName],
  pageSize: 100
});

let totalProcessed = 0;
let totalLinked = 0;
let totalCreated = 0;
let totalSkipped = 0;

async function processEmailRecords(records) {
  for (let record of records) {
    const email = record.getCellValueAsString('emailOfAccessor');
    const existingLink = record.getCellValue(linkFieldName);

    // Skip if already linked
    if (existingLink && existingLink.records && existingLink.records.length > 0) {
      totalSkipped++;
      totalProcessed++;
      continue;
    }

    if (!email || !email.includes('@')) {
      totalSkipped++;
      totalProcessed++;
      continue;
    }

    // Extract domain from email
    const domain = email.split('@')[1].toLowerCase().trim();

    // Check if org exists for this domain
    let matchingOrg = orgsByDomain.get(domain);

    if (!matchingOrg) {
      // Create new organization
      output.text(`Creating org for domain: ${domain}`);
      const newOrgId = await organizationsTable.createRecordAsync({
        'conventionalName': domain.split('.')[0], // e.g., "acme" from "acme.com"
        'url': domain
      });

      // Fetch the newly created record so we can link it
      const newOrgQuery = await organizationsTable.selectRecordsAsync({
        recordIds: [newOrgId]
      });
      matchingOrg = newOrgQuery.records[0];

      // Add to our index
      orgsByDomain.set(domain, matchingOrg);
      totalCreated++;
    }

    // Link the emailAccess record to the organization
    const linkField = emailAccessTable.getField(linkFieldName);
    await emailAccessTable.updateRecordAsync(record.id, {
      [linkField.id]: [{ id: matchingOrg.id }]
    });
    totalLinked++;

    totalProcessed++;
    output.clear();
    output.text(`Processed ${totalProcessed} records...`);
  }
}

// Process all pages
await processEmailRecords(emailQuery.records);
while (emailQuery.hasMoreRecords) {
  await emailQuery.loadMoreRecords();
  await processEmailRecords(emailQuery.records.slice(-100));
}

// Final summary
output.clear();
output.markdown(`### ✅ Email to Organization Linking Complete`);
output.table([
  { Metric: 'Total Processed', Count: totalProcessed },
  { Metric: 'Newly Linked', Count: totalLinked },
  { Metric: 'Organizations Created', Count: totalCreated },
  { Metric: 'Skipped (already linked or invalid)', Count: totalSkipped }
]);
```

## How It Works

### Step 1: Index Organizations by Domain

```javascript
const orgsByDomain = new Map();

function extractDomainFromUrl(url) {
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}
```

This creates a lookup table so we can quickly find orgs by domain without repeated queries.

### Step 2: Process Email Records

For each email in `emailAccess`:

```
email: "john@acme.com"
  ↓
domain: "acme.com"
  ↓
orgsByDomain.get("acme.com")
  ↓
Found? → Link to existing org
Not found? → Create org, then link
```

### Step 3: Create Organization if Needed

```javascript
const newOrgId = await organizationsTable.createRecordAsync({
  'conventionalName': domain.split('.')[0], // "acme"
  'url': domain                              // "acme.com"
});
```

### Step 4: Link Records

```javascript
const linkField = emailAccessTable.getField(linkFieldName);
await emailAccessTable.updateRecordAsync(record.id, {
  [linkField.id]: [{ id: matchingOrg.id }]
});
```

## Output

The script displays a summary table:

| Metric | Count |
|--------|-------|
| Total Processed | 25 |
| Newly Linked | 20 |
| Organizations Created | 5 |
| Skipped (already linked or invalid) | 5 |

## Customization Options

### Different conventionalName Format

Currently uses first part of domain. To use full domain:

```javascript
'conventionalName': domain  // "acme.com" instead of "acme"
```

### Add More Fields to New Organizations

```javascript
const newOrgId = await organizationsTable.createRecordAsync({
  'conventionalName': domain.split('.')[0],
  'url': domain,
  'Entity-Type': 'Unknown',
  'elevatorPitch': `Organization created from email access: ${email}`
});
```

### Only Process Recent Records

Add a date filter:

```javascript
let emailQuery = await emailAccessTable.selectRecordsAsync({
  fields: ['emailOfAccessor', linkFieldName, 'sessionStartTime'],
  pageSize: 100,
  sorts: [{ field: 'sessionStartTime', direction: 'desc' }]
});
```

## Troubleshooting

### "Field not found" Error

Make sure the link field name matches exactly:
```javascript
const linkFieldName = 'Organization';  // Must match your field name
```

### Records Not Linking

Check that the link field is configured correctly:
- Type: Link to Another Record
- Related table: organizations
- Relation type: Many-to-One or Many-to-Many

### Organizations Not Being Found

The domain matching is case-insensitive and strips `https://`, `http://`, and `www.`. Make sure your organization `url` fields are populated.

## Sources

- [NocoDB Scripts - Table API](https://nocodb.com/docs/scripts/api-reference/table)
- [NocoDB Scripts - Record API](https://nocodb.com/docs/scripts/api-reference/record)
- [NocoDB Scripts - Link Records Example](https://nocodb.com/docs/scripts/examples/demo/records-link)
- [NocoDB Scripts - Link Records by Field](https://nocodb.com/docs/scripts/examples/link-records-by-field)
