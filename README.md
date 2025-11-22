<div align="center">

# 🐷 Veckopeng

**A self-hosted family chores & allowance tracker for your homelab.**  
Parents create tasks ➜ kids complete them ➜ parents approve ➜ allowance builds up ➜ pay out via Swish.

</div>

---

## ✨ What is Veckopeng?

Veckopeng is a small self-hosted web app for families:

- 👨‍👩‍👧‍👦 **Multiple family members** – parents and kids with different roles.
- ✅ **Chore / task system** – create tasks and assign them to kids.
- 🔔 **Approval flow** – kids mark tasks as done, parents approve or reject.
- 💰 **Allowance tracking** – each child has:
  - current balance
  - lifetime “total earned”.
- 📲 **Swish-friendly payout** – at the end of the week you can pay out the balance via Swish from your phone.
- 🌓 **Light & dark mode** – fits well in dark homelab control rooms 😄
- 💾 **Local persistent storage** – all state is stored in a JSON file on your server.

No cloud. No tracking. Just a simple app you run yourself.

---

## 🏗 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Storage:** JSON file on disk (`/data/state.json` inside the backend container)
- **Deployment:** Docker & `docker-compose` friendly

---

## 🚀 Quick Start (Docker)

> Recommended way to run Veckopeng on a homelab / NAS / small VM.

### 1. Clone the repo

```bash
git clone https://github.com/daevilb/veckopeng.git
cd veckopeng
