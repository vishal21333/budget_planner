# Budget Planner (React + Vite)

Project Review 2 checklist:

- React + Vite project
- Two modules: **User** (overview, transactions, goals) and **Admin** (system overview, categories, users)
- Login and Signup using Local Storage
- Ready to deploy on Vercel

## Run locally

    npm install
    npm run dev

Open the printed address (usually http://localhost:5173).

## Demo accounts

| Role  | Email               | Password |
| ----- | ------------------- | -------- |
| Admin | admin@budget.com    | admin123 |
| User  | priya@example.com   | demo1234 |

New users can also sign up from the Create account page.

## Put it on GitHub

    git init
    git add .
    git commit -m "Budget Planner"
    git branch -M main
    git remote add origin https://github.com/<your-username>/<repo-name>.git
    git push -u origin main

(Create the empty repo on github.com first.)

## Deploy on Vercel (CLI, as in the class notes)

    npm install -g vercel
    vercel login
    vercel

Answer the prompts:
- Set up and deploy? **yes**
- Link to existing project? **no**
- Project name: **budget-planner** (any name)
- Directory where your code is: **press Enter**
- Want to modify these settings? **no**

Vercel prints a deployment link. For a final production link run `vercel --prod`.

## How it works

All data is stored in the browser's Local Storage (see `src/api.js`), so each browser has its own
accounts and transactions. Demo data is created on first load. To reset, clear the site data in the browser.
Passwords are stored as plain text because this is a Local Storage demo.
