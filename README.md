# Expense Tracker

A minimal client-side expense tracker web app.

Features
- Add expenses with title, amount, category, and date
- Persistent storage using localStorage
- Charts (Chart.js) showing spending by category and spending over time
- Date-range filter for list and charts
- Export expenses to CSV and clear all
- Responsive website layout with a subtle tiled background

How to run
1. Open `index.html` in a browser, or use the VS Code Live Server extension to preview.
2. Add expenses using the form on the left.
3. Use filters and charts on the right.

Deployment (GitHub Pages)
- This project is a static site and can be hosted on GitHub Pages. A workflow is included in `.github/workflows/pages.yml` to deploy on push to `main`.

Notes
- Data is stored locally in your browser under the key `expenses_v1`. Clearing browser storage or switching devices will not keep the data unless you export/import via CSV.
- No backend or authentication is implemented yet.

License
MIT

## Expense Tracker Web App

A responsive web application that allows users to track expenses, calculate totals, and visualize spending trends using interactive charts.

### Features
- Add/Delete Expenses
- Persistent Storage (LocalStorage)
- Real-Time Balance Calculation
- Interactive Chart Visualization
- Modern Glassmorphism UI

### Tech Stack
- HTML5
- CSS3
- JavaScript (ES6)
- Chart.js
