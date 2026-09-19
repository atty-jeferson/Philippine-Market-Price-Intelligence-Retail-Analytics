# The Grocer

## Philippine Market Price Intelligence & Retail Analytics

**The Grocer** is a market price intelligence and retail analytics application designed to examine product pricing, brand positioning, retailer differences, competitive structure, and price movements in the Philippine market.

The application combines data processing, statistical analysis, economic interpretation, and interactive visualization to transform structured retail price observations into analytical insights.

---

## Overview

The platform is designed to support the analysis of:

* Product and brand price levels
* Unit-price differences across products and sizes
* Brand price architecture
* Retailer and channel pricing
* Competitive positioning
* Price movements and trends
* Product-level price comparisons
* Relative price and value indicators
* Market opportunities

The system places particular emphasis on **data quality, price normalization, statistical analysis, and transparent analytical methodology**.

---

## Analytical Framework

The application follows a structured data pipeline:

```text
Raw Retail Data
      ↓
Schema Detection
      ↓
Field Mapping
      ↓
Entity Resolution
      ↓
Data Normalization
      ↓
Validation & Quality Checks
      ↓
Duplicate Detection
      ↓
Statistical Checks
      ↓
Normalized Dataset
      ↓
Market Analytics
      ↓
Interactive Visualization
```

This structure separates data preparation from analytical computation, allowing the resulting indicators and visualizations to be based on a consistent dataset.

---

## Core Analytics

### Market Analysis

Provides an overview of observed market prices and product distributions, including:

* Average and median prices
* Price distributions
* Quantiles
* Price dispersion
* Market-level comparisons

### Price Analysis

Analyzes price differences across products, brands, retailers, and product sizes.

Unit prices are normalized using:

```text
Price per 100g = Shelf Price / Total Weight × 100
```

This allows products with different package sizes to be compared on a common basis.

### Brand Price Architecture

Examines how products within a brand are positioned across different price points and product segments.

### Retailer Analysis

Compares observed prices across retail channels, including:

* Supermarkets and hypermarkets
* Pharmacies and health retailers
* E-commerce marketplaces

### Competitive Landscape

Analyzes relative positioning between competing brands and products using observed price and market attributes.

### Price Trends

Tracks observed price movements over time and supports comparative analysis across products, brands, and retailers.

### Product Positioning

Provides product-level comparisons based on normalized pricing and selected analytical indicators.

### Opportunities Analysis

Identifies potentially notable pricing patterns and market observations based on the underlying dataset and analytical rules.

---

## Data Engineering & Quality Controls

Data quality is treated as a core component of the analytical process.

The application supports:

* CSV data ingestion
* Automated column mapping
* Schema validation
* Entity and product identification
* Data normalization
* Duplicate detection
* Missing-value checks
* Invalid-value detection
* Date validation
* Outlier checks
* Data quality reporting
* Data provenance tracking

The system distinguishes between different evidence states, including:

* **Observed** — directly provided by the source data
* **Derived** — calculated from observed information
* **Estimated** — generated using an estimation procedure
* **Inferred** — determined through analytical or classification rules

This distinction helps maintain transparency between source observations and calculated indicators.

---

## Statistical Analysis

The application incorporates statistical methods commonly used in market and economic analysis, including:

* Mean
* Median
* Quantiles
* Measures of dispersion
* Distribution analysis
* Outlier detection
* Unit-price normalization
* Price indices
* Relative price positioning
* Trend analysis
* Competitive comparisons

The analytical framework is designed to support descriptive market analysis rather than imply causal relationships where the underlying data cannot establish them.

---

## SQL Proficiency

**Intermediate**

SQL is part of my broader data analytics toolkit and is used for structured data querying, transformation, and analytical workflows.

Key competencies include:

* `SELECT`, `WHERE`, `ORDER BY`
* `GROUP BY` and `HAVING`
* Aggregate functions
* `JOIN` operations
* Subqueries
* Common Table Expressions (CTEs)
* `CASE WHEN` logic
* Date and time operations
* Data cleaning and transformation
* Window functions
* `LAG()` and `LEAD()`
* Ranking and analytical queries

Example analytical query:

```sql
SELECT
    brand,
    COUNT(*) AS product_count,
    AVG(price_php) AS average_price,
    MIN(price_php) AS minimum_price,
    MAX(price_php) AS maximum_price
FROM price_observations
GROUP BY brand
ORDER BY average_price DESC;
```

> **Note:** SQL is part of my broader analytics proficiency; the current version of The Grocer does not contain a dedicated SQL database layer.

---

## Power BI Proficiency

**Intermediate**

Power BI is part of my broader business intelligence and data visualization toolkit.

Key competencies include:

* Power Query
* Data transformation
* Data modeling
* Table relationships
* Calculated columns
* DAX measures
* KPI development
* Interactive dashboards
* Slicers and filters
* Drill-down analysis
* Time-series visualization
* Comparative market analysis
* Business reporting

A typical analytical workflow includes:

```text
Data Source
    ↓
Power Query
    ↓
Data Cleaning & Transformation
    ↓
Data Model
    ↓
DAX Measures
    ↓
Interactive Dashboard
    ↓
Analytical Reporting
```

> **Note:** Power BI is part of my broader analytics proficiency; the current version of The Grocer uses a React-based visualization interface rather than a Power BI report.

---

## Technology Stack

### Application

* React
* TypeScript
* Vite
* Tailwind CSS

### Visualization

* Recharts
* Lucide React
* Motion

### Data Processing

* CSV ingestion and export
* Schema mapping
* Data normalization
* Entity resolution
* Validation
* Statistical processing

### Analytics Toolkit

* SQL
* Power BI
* Excel
* Stata
* Python
* Gretl

---

## Data Model

The analytical structure follows a relationship between:

```text
Brand
  ↓
Product
  ↓
SKU
  ↓
Retailer
  ↓
Price Observation
  ↓
Data Source
```

Each observation may contain information such as:

* Product identification
* Brand
* Product name
* Variant
* Package size
* Price
* Unit price
* Price index
* Retailer
* Retailer type
* Rating
* Collection date
* Product attributes
* Data source

---

## Analytical Indicators

The platform supports calculated indicators such as:

### Price per 100g

```text
Price per 100g = Price / Weight × 100
```

### Price Index

Measures the relative price of a product against a defined analytical reference.

### Value Score

A constructed analytical indicator used to compare selected product attributes relative to price.

The Value Score is **model-dependent** and should be interpreted as an analytical measure rather than an objective or universal measure of consumer value.

---

## Application Modules

The application includes analytical views for:

* Market Overview
* Price Explorer
* Price Trends
* Brand Analysis
* Brand Price Architecture
* Channel Price Architecture
* Competitive Landscape
* Product Comparison
* Product Positioning
* Retailer Analysis
* Economic Analysis
* Opportunities
* Data Methodology

---

## Research & Economic Perspective

The Grocer is designed from an applied economics perspective, combining:

**Economic Analysis + Statistics + Data Analytics + Market Research**

The project demonstrates how retail-level price observations can be structured and analyzed to examine market behavior, price dispersion, competitive positioning, and differences across retail channels.

It is intended as an analytical and portfolio project rather than a substitute for official price statistics or comprehensive market datasets.

---

## Project Structure

```text
src/
├── components/
├── domain/
│   ├── competitive.ts
│   ├── identity.ts
│   ├── mapping.ts
│   ├── normalization.ts
│   ├── opportunities.ts
│   ├── pipeline.ts
│   ├── priceArchitecture.ts
│   ├── signals.ts
│   ├── statistics.ts
│   └── validation.ts
├── data/
├── services/
└── App.tsx
```

The domain layer separates analytical logic from the presentation layer, supporting a more maintainable structure for data processing and market analysis.

---

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm run test
```

### Type Check

```bash
npm run lint
```

### Build

```bash
npm run build
```

---

## Professional Skills Demonstrated

### Economics & Research

* Applied Economic Analysis
* Market Research
* Economic Data Analysis
* Price Analysis
* Descriptive Statistics
* Research Methodology

### Data Analytics

* SQL
* Power BI
* Excel
* Python
* Stata
* Gretl
* Data Cleaning
* Data Visualization

### Data & Software

* Data Pipelines
* Data Validation
* Entity Resolution
* Statistical Processing
* React
* TypeScript
* Analytical Dashboard Development

---

## Project Purpose

The project demonstrates the application of **economic reasoning, statistical analysis, and data engineering principles to retail market intelligence**.

It is particularly relevant to work involving:

* Market Research
* Economic Analysis
* Business Intelligence
* Pricing Analytics
* Data Analytics
* Applied Research
* Consumer and Retail Analytics

---

## Disclaimer

The Grocer is an analytical and portfolio project. Its results depend on the quality, coverage, collection dates, and representativeness of the underlying retail price observations.

Calculated indicators and analytical classifications should therefore be interpreted within the methodology and dataset used.
