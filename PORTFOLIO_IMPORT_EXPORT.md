# Portfolio Import & Export Documentation

This document describes the CSV format for importing and exporting portfolio holdings in Dynamic Stock Analyzer.

## Export Format

When you export a portfolio, the system generates a CSV file with the following structure:

### CSV Structure

```
Symbol,Quantity,Average Price,Added At,Current Value
```

**Column Descriptions:**

1. **Symbol** (string): Stock ticker symbol (e.g., AAPL, RELIANCE.NS)
2. **Quantity** (number): Number of shares held (supports decimals)
3. **Average Price** (number): Average price per share at which stock was acquired
4. **Added At** (ISO date string): Timestamp when holding was added to portfolio
5. **Current Value** (number): Calculated value (Quantity × Average Price)

### Export Rules

- Exports use comma separators (`,`)
- Numbers use decimal point (`.`) notation
- Dates in ISO 8601 format
- UTF-8 encoding
- No quotes around text fields unless they contain commas

---

## Import Format

To import holdings into an existing portfolio, prepare a CSV file following this format:

### Minimal CSV Structure (Required Columns)

```
symbol,quantity,averagePrice
```

**OR with optional header:**

```
Symbol,Quantity,Average Price
AAPL,100,150.50
GOOGL,50,2800.00
RELIANCE.NS,200,2450.75
```

### Column Requirements

1. **symbol** (required):
   - 1-20 characters
   - Alphanumeric with dots (`.`) and hyphens (`-`) allowed
   - Case insensitive (will be converted to uppercase)
   - Examples: `AAPL`, `RELIANCE.NS`, `BRK.B`

2. **quantity** (required):
   - Positive number
   - Supports decimals (minimum: 0.000001)
   - Represents number of shares

3. **averagePrice** (required):
   - Positive number
   - Price per share in base currency
   - Supports decimals

### Import Rules

- First line can be header (automatically detected if contains "symbol" text)
- Empty lines are skipped
- Whitespace around values is trimmed
- Duplicate symbols: Last entry overwrites previous
- Maximum file size: 5MB
- No limit on number of holdings (within file size constraint)

### Example Import Files

**Minimal format (no header):**
```
AAPL,10,150.25
MSFT,25,380.50
TSLA,5,245.00
```

**With header:**
```
Symbol,Quantity,Average Price
AAPL,10,150.25
MSFT,25,380.50
TSLA,5,245.00
```

**With decimal quantities:**
```
symbol,quantity,averagePrice
BTC-USD,0.5,45000.00
ETH-USD,2.5,3500.00
```

---

## Validation

### Import Validation Rules

The system validates each row and will reject the entire import if:

1. **Invalid format**: Line doesn't have at least 3 comma-separated values
2. **Invalid symbol**: Empty or contains invalid characters
3. **Invalid quantity**: Not a number, zero, or negative
4. **Invalid price**: Not a number, zero, or negative

### Error Messages

Examples of validation errors:

- `"Invalid CSV format at line 5: expected at least 3 columns"`
- `"Invalid data at line 3: symbol='', quantity='abc', price='100'"`
- `"Invalid values at line 7: quantity and price must be positive"`
- `"No valid holdings found in CSV file"`

---

## API Endpoints

### Export Portfolio

**Frontend:**
```typescript
import { api } from '@/lib/api';
import { exportPortfolioToCSV, downloadCSV } from '@/lib/export';

// Get portfolio and export
const portfolio = await api.getPortfolio(portfolioId);
const csvData = exportPortfolioToCSV(portfolio);
downloadCSV(csvData, 'my_portfolio.csv');
```

### Import Holdings

**Frontend:**
```typescript
// User selects file via <input type="file">
const file = fileInputElement.files[0];
await api.importPortfolioCSV(portfolioId, file);
```

**Backend Endpoint:**
```
POST /api/portfolio/:id/import
Content-Type: multipart/form-data

file: <CSV file>
```

---

## Best Practices

### Exporting

1. **Regular Backups**: Export portfolios regularly for backup purposes
2. **Naming Convention**: Use descriptive names (e.g., `retirement_portfolio_2024.csv`)
3. **Version Control**: Include date in filename for tracking changes

### Importing

1. **Validate Before Upload**: Open CSV in spreadsheet software to verify format
2. **Check Symbols**: Ensure stock symbols are correct (use .NS for NSE stocks)
3. **Verify Prices**: Confirm prices are in correct currency
4. **Small Batches**: For large portfolios, import in batches to detect errors early

### Data Preparation

**Creating CSV in Excel/Google Sheets:**

1. Create columns: Symbol, Quantity, Average Price
2. Fill in data
3. Export as CSV (UTF-8)
4. Verify commas are used as separators

**Creating CSV Programmatically:**

```javascript
// JavaScript example
const holdings = [
  { symbol: 'AAPL', quantity: 10, averagePrice: 150.25 },
  { symbol: 'MSFT', quantity: 25, averagePrice: 380.50 }
];

const csv = [
  'symbol,quantity,averagePrice',
  ...holdings.map(h => `${h.symbol},${h.quantity},${h.averagePrice}`)
].join('\n');

// Save or upload csv
```

---

## Error Recovery

### Common Issues

**Issue**: "CSV file is empty"
- **Cause**: File contains no data or only whitespace
- **Solution**: Add at least one holding with valid data

**Issue**: "Invalid CSV format"
- **Cause**: Missing columns or incorrect separator
- **Solution**: Ensure each line has exactly 3 comma-separated values

**Issue**: "Invalid values: quantity and price must be positive"
- **Cause**: Zero or negative numbers in quantity/price columns
- **Solution**: All quantities and prices must be greater than zero

**Issue**: "Symbol already exists"
- **Cause**: Duplicate symbol in import file
- **Solution**: Remove duplicate or merge quantities before import

### Rollback

If import fails:
1. No partial imports - all or nothing
2. Portfolio remains unchanged on error
3. Review error message for specific line number
4. Fix CSV and retry

---

## Security Considerations

1. **File Size Limit**: Maximum 5MB per upload
2. **Validation**: All data validated before processing
3. **No Code Execution**: CSV is parsed as data only (no formula evaluation)
4. **Sanitization**: Symbols validated against whitelist pattern

---

## Future Enhancements

Planned features (not yet implemented):

- PDF export with charts and analytics
- Multi-portfolio export
- Import with automatic price fetching
- Template CSV download
- Excel (.xlsx) support

---

## Support

For issues with import/export:

1. Verify CSV format matches specification
2. Check file encoding is UTF-8
3. Ensure backend is running and accessible
4. Review backend logs for detailed error messages
5. Test with minimal CSV (1-2 holdings) first
