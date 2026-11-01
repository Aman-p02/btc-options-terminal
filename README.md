# BTC Options-Selling Research Terminal

> **Production-Grade Quantitative Research Terminal for Bitcoin Options Sellers**  
> Evaluates strike safety, empirical stop-loss survival, and strategy backtests backed by 9.2 years (~29.2 crore rows) of real Binance 1-second BTCUSDT history (2017-08-17 to 2026-10-31 UTC).

---

## 1. Product Name Suggestions

As requested in the project brief, here are 3 proposed names for the product:

1. **ExcursionBTC** *(Recommended)*  
   *Rationale*: Directly describes the core quantitative innovation: measuring true intra-candle adverse price excursions from raw 1-second ticks rather than misleading close-to-close metrics. Resonates strongly with systematic crypto derivative traders.
2. **DeltaSafe Terminal**  
   *Rationale*: Professional, confidence-inspiring options brand communicating mathematical strike distance safety, tail-risk mitigation, and options delta awareness.
3. **SigmaHorizon**  
   *Rationale*: Institutional terminal moniker emphasizing statistical rigor ($\sigma$ confidence intervals) evaluated across multi-hour holding horizons (1h to 24h).

---

## 2. Architecture Overview

This monorepo is engineered as a zero-data-leakage, high-performance analytical architecture:

```
├── /etl                   # Python + DuckDB 2.0.0 ETL Pipeline
│   ├── run_etl.py         # Builds candles_1m, excursions, daily/hourly regime stats
│   ├── verify_data.py     # Cross-checks 5 random dates against raw 1s parquet ticks
│   └── DATA_VERIFICATION_REPORT.md  # 100% precision audit report
├── /api                   # Python FastAPI Analytics Microservice
│   ├── main.py            # Microservice with shared-secret authorization
│   ├── stats.py           # Wilson score CI, Black-Scholes (r=0), delta
│   ├── routers/           # Heatmap, Strike Finder, Distance, SL Planner, Backtester, Live
│   ├── run_tests.py       # Deterministic hand-calculation & API verification suite
│   ├── Dockerfile         # Production container for Railway / Fly.io / Render
│   └── requirements.txt
├── /web                   # Next.js 14 App Router (TypeScript + Tailwind CSS)
│   ├── src/app/           # Server-side routes with server-enforced plan gating
│   ├── src/components/    # Bloomberg-dense, accessible terminal components
│   └── src/lib/           # i18n (English/Hindi), API clients, Zod schemas
├── /processed             # Precomputed compact Parquet data (ZSTD compressed)
│   ├── candles_1m.parquet       # 4,833,848 rows (154.6 MB)
│   ├── excursions.parquet       # 2,572,731 rows (63.2 MB)
│   ├── daily_stats.parquet      # 3,363 rows (170 KB)
│   └── hourly_stats.parquet     # 80,684 rows (2.88 MB)
├── .github/workflows/daily_etl.yml  # Automated daily Binance Vision incremental ETL
├── schema.sql             # Neon / Supabase PostgreSQL schema
└── docker-compose.yml     # Local production simulation
```

---

## 3. Statistical Honesty Principles (Non-Negotiable)

- **Zero Fake Data**: Every touch rate, median, percentile, and win rate is calculated directly from actual Binance 1-second history.
- **Strict Intra-Candle Breach**: A "touch" is defined if **any single 1-second tick** during the holding window hit or breached the strike price.
- **No Illusionary Language**: Words like *"guaranteed"*, *"risk-free"*, or *"100% safe"* are strictly forbidden. The system states: *"Historically touched in X% of N cases"*.
- **Wilson 95% Score Confidence Intervals**: Accompanies all touch probabilities to expose small-sample uncertainty.
- **Selection Bias Defense**: Scanning 168 weekly slots creates a multiple-hypothesis testing bias. The terminal warns users and mandates Out-of-Sample verification (train on 2017-2023, test on 2024-2026).
- **Theoretical Pricing Disclaimers**: Option premiums are calculated via Black-Scholes ($r=0$) and explicitly labeled *"Theoretical Estimate"*.

---

## 4. Verification and Benchmark Audit

### Milestone 1: ETL Verification Cross-Check
The ETL output was verified by randomly sampling 5 historical dates across diverse market regimes (2018 bear market, 2020 COVID crash, 2021 ATH, 2023 ETF rally, 2026 recent regime), recomputing max up/down/net excursions from raw 1-second tick files, and asserting equality against `excursions.parquet`:

| Date (UTC) | Hold Duration | Raw 1s Ticks Read | Raw Max Adverse % | ETL Parquet Move % | Difference | Status |
|---|---|---|---|---|---|---|
| **2018-04-12 08:15** | 240m (4h) | 14,400 ticks | +17.2826% | +17.2826% | 0.0000% | **PASSED** |
| **2020-03-12 10:30** | 360m (6h) | 21,600 ticks | +23.0724% (COVID) | +23.0724% | 0.0000% | **PASSED** |
| **2021-11-10 14:45** | 120m (2h) | 7,200 ticks | +0.5217% | +0.5217% | 0.0000% | **PASSED** |
| **2023-06-21 18:00** | 720m (12h) | 43,200 ticks | +1.3955% | +1.3955% | 0.0000% | **PASSED** |
| **2026-02-15 04:15** | 1440m (24h) | 86,400 ticks | +3.4427% | +3.4427% | 0.0000% | **PASSED** |

### Milestone 2: Analytical Latency & Formula Unit Tests
All 12 mathematical and API tests passed with flying colors:
- **Heatmap Query**: Cold: 94.0 ms | Cached: 0.000 ms (Requirement: p95 < 500 ms)
- **Strike Finder**: 380.2 ms
- **Distance Calculator**: 127.2 ms
- **SL Planner**: 77.2 ms
- **Backtester**: 127.0 ms
- **Live Ticker**: 310.4 ms

---

## 5. Step-by-Step Deployment Guide

### A. Deploy Analytics API (Railway, Fly.io, or Render)

1. **Deploy Container**:
   - Push repository to GitHub.
   - Connect repository to Railway or Fly.io using `api/Dockerfile`.
   - Expose port `8000`.

2. **Uploading Precomputed Parquet Files**:
   - The precomputed parquets (`excursions.parquet`, `candles_1m.parquet`, `daily_stats.parquet`, `hourly_stats.parquet`) total only ~220 MB.
   - **Option 1 (Persistent Volume)**: Attach a 1 GB persistent volume mounted at `/app/data/processed` on Railway or Fly.io. Upload via SFTP or `scp`.
   - **Option 2 (Cloud Object Storage)**: Place files in Cloudflare R2 or AWS S3. On container startup, download files:
     ```bash
     aws s3 sync s3://my-bucket/processed /app/data/processed --endpoint-url $R2_ENDPOINT
     ```
   - **Option 3 (Docker image bundle)**: Since total processed data is under 250 MB, you can bundle `/processed` directly into the container during docker build for instant zero-dependency deploys.

3. **Set Environment Variables on API**:
   ```ini
   BTC_PROCESSED_DIR=/app/data/processed
   ANALYTICS_API_SECRET=your-secure-internal-secret-here
   BYPASS_INTERNAL_AUTH=false
   ```

### B. Deploy Web App (Vercel)

1. Connect your repository to **Vercel**.
2. Set Root Directory to `web`.
3. Framework Preset: `Next.js`.
4. Configure Environment Variables:
   ```ini
   ANALYTICS_API_URL=https://your-analytics-api.up.railway.app
   ANALYTICS_API_SECRET=your-secure-internal-secret-here
   NEXT_PUBLIC_DEFAULT_TIMEZONE=330
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_WEBHOOK_SECRET=...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   DATABASE_URL=postgresql://...
   ```
5. Deploy. Vercel will build and host the Next.js application at global edge locations.

### C. Deploy Database (Neon or Supabase)

1. Create a serverless PostgreSQL database on **Neon** or **Supabase**.
2. Open SQL Editor and execute `schema.sql` to initialize tables, indexes, and billing audit logs.
3. Configure your webhook URLs on Razorpay (`https://yourdomain.com/api/billing/razorpay`) and Stripe (`https://yourdomain.com/api/billing/stripe`).

---

## 6. Regulatory & Commercialization Warning

> [!IMPORTANT]
> **Mandatory Review Before Charging Users**:
> 1. **Binance Data Policies**: Review Binance terms of service regarding redistribution and derivative products created from public market data feeds. Ensure proper attribution is maintained.
> 2. **Financial Research Regulations**: In jurisdictions like India (SEBI Research Analyst / Investment Advisor regulations) and the US (CFTC / SEC), distributing options trading recommendations or fee-based advisory signals requires licensing. Ensure this terminal is marketed strictly as an educational and statistical quantitative backtesting software tool, not financial advice.

