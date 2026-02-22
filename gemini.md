# VJ Tech CRM Intelligence Dashboard - Constitution

This file defines the strict, non-negotiable data schema and business rules for the VJ Tech CRM Dashboard, ensuring a fully deterministic system built on the B.L.A.S.T + A.N.T architecture.

## 1. Data Schema & Relationships

### 1.1 Opportunities Source
- **Opportunity ID**: Unique identifier
- **Created On**: Date
- **Account Name**: String (Primary join key to Customers)
- **Country / Country Name**: String
- **Total**: Numeric (Native currency)
- **Status**: String ("New", "Open", "Won", "Lost")
- **Stage**: String (Format: "(XX%) Stage Name")
- **Currency**: String ("GBP", "USD", "EUR")
- **Estimated Close Date**: Date
- **Owner**: String
- **User Defined Probability**: String (Format: "XX%")
- **Actual Close Date**: Date (Optional)
- **Reason**: String (Optional)
- **Source**: String (Optional)

### 1.2 Customers Source
- **Customer ID**: Unique identifier
- **Customer Name**: String (Target join key from Opportunities)
- **Customer Class**: String ("PRIVLAB", "EDU", "RESELLER", etc.)
- **Sales Region**: String ("Western Europe", "Asia Pacific", etc.)
- **Country**: String
- **City**: String

### 1.3 Data Relationships
- **Primary Join**: `Opportunities.Account Name` ➔ `Customers.Customer Name` (Expected Match ~94%)
- **Fallback Join**: Utilize a local alias mapping table (`customer_alias_map.csv`) to resolve the remaining ~6% unmatched accounts.

---

## 2. Core Business Rules

**Rule 2.1: Open Pipeline Definition**
- Open Pipeline = `Status IN { "New", "Open" }`.
- "Won" and "Lost" opportunities are strictly excluded from open pipeline reporting.

**Rule 2.2: Currency Normalisation**
- All opportunity values must be normalized to GBP.
- Required storage per opportunity: `Native value`, `Native currency`, `FX rate used`, and `Converted GBP value`.
- FX rates must be deterministic and configurable in the dashboard settings.

**Rule 2.3: Probability Calculation Modes**
User-selectable modes driving dashboard visualisations:
- **Unweighted**: `value_gbp`
- **Stage-weighted**: `value_gbp * stage_probability`
- **User-weighted**: `value_gbp * user_defined_probability`
- **Blended**: `value_gbp * (0.5 * stage_probability + 0.5 * user_probability)`

**Rule 2.4: Stage Probability Parsing**
- System must extract the numeric percentage inside parentheses from the `Stage` string (e.g., "(30%) Proposal Sent" ➔ 0.30).
- If no percentage exists, `stage_probability` = `NULL`, flagging the row in the data quality report.

**Rule 2.5: User Probability Parsing**
- Similar numeric percentage parsing from `User Defined Probability` (e.g., "20%" ➔ 0.20).
- A blank field is treated as `NULL` (No assumed values or guessing).

**Rule 2.6: Pipeline Ageing Logic**
- `Age (Days) = Today - Created On`
- Standardised Age Bands: `0–30`, `31–60`, `61–90`, `91–180`, `181–270`, `271–365`, `365+`.

**Rule 2.7: Close Month Parsing**
- Parsed from `Estimated Close Date`. Format required: `YYYY-MM`.

**Rule 2.8: Week-Over-Week (WoW) Growth & Snapshots**
- The system must capture and store a timestamped snapshot of pipeline data upon each upload.
- Metrics required against previous snapshot:
  - Current open value & count
  - Previous open value
  - Growth Ratio = `current / previous`
  - Created Last 7 Days (Count & Value)
  - Won Last 7 Days (Count & Value)
  - Lost Last 7 Days (Count & Value)

**Rule 2.9: Data Quality Requirements**
The system must generate a self-validating data quality report highlighting:
- Join Match Rate
- Unmatched Account Names
- Invalid Probability Rows (either Stage or User defined)
- Invalid Date Rows
- Currency Conversion Issues
- Duplicate Opportunity IDs

> [!WARNING]
> No probabilistic LLM mathematical operations are allowed in the compilation of data. All numeric operations must be strictly deterministic in the business logic layer.
