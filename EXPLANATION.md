# Dashboard Metrics Explanation

Finsight provides several advanced financial metrics on the dashboard to help you understand your financial health.

## 1. Net Worth
**Calculation:** `Cash Balance + Portfolio Value`
- **Cash Balance:** Sum of all 'Income' transactions minus all 'Expense' transactions.
- **Portfolio Value:** Current market value of all your assets (Stocks, Crypto, Mutual Funds) based on their quantity and current price.

## 2. Survival Runway (Stress Test)
**Calculation:** `Current Liquidity / Monthly Burn Rate`
- **Current Liquidity:** Your total Net Worth (Cash + Portfolio).
- **Monthly Burn Rate:** Sum of all 'Expense' transactions in the last 30 days.
- **Runway Days:** How many days you can survive if your income stops today.
- **Stressors:** You can simulate scenarios like "Rent Hike", "Job Loss", or "Emergency Expenses" to see how they impact your runway.

## 3. Financial Health Score
**Calculation:** A weighted average (0-100) of four key metrics:
1. **Savings Score:** Based on your 30-day savings rate (Target: 20% of income).
2. **Spending Score:** Based on budget adherence (Did you stay within your limits?).
3. **Investment Score:** Based on your investment-to-net-worth ratio (Target: 30%).
4. **Emergency Fund Score:** Based on having at least 3 months of survival runway.

## 4. Upcoming Bills
**Logic:** Displays bills that have not been marked as 'Paid'.
- You can manage these in the `Budgets & Goals` section.
- The dashboard widget provides a quick glance at what needs to be paid soon to avoid late fees.
