![Veckopeng Banner](./docs/veckopeng-banner.png)

# Veckopeng

A modern, family-friendly app for managing chores, weekly allowance, and payment deep links — designed for self-hosting, privacy, and simplicity.

---

## 🌟 Overview

**Veckopeng** is a lightweight but powerful family app where parents can:
- Create and assign tasks (chores)
- Set reward amounts
- Track each child’s weekly allowance
- Trigger payment directly from their phone’s payment app

Children complete tasks → parents approve them → the reward is added to the child’s balance.  
At the end of the week, the parent taps **Pay**, and Veckopeng opens the payment app with the **phone number**, **amount**, and optional **message** prefilled.

Veckopeng is built for **self-hosting** using Docker and keeps all your data in your own environment.

---

## 📚 Table of Contents

- Features
- Payment Deep Links
- Self-Hosted by Design
- Getting Started
- Configuration
- Tech Stack
- Contributing
- Support
- License
- Roadmap

---

## ✨ Features

### 👨‍👩‍👧 Family Management
- Add parents and children
- Assign phone numbers per user
- Role-based experience:
  - Children see a simplified “My tasks / My week” view
  - Parents can manage tasks, approvals, and payments

### 📝 Task & Reward System
- Create chores with title, description, and reward amount
- Children mark tasks as completed
- Tasks stay pending until approved or rejected
- Approved tasks increase the child’s weekly balance

---

## 💸 Payment Deep Links

Veckopeng uses **payment deep links**, similar to Swish and other mobile payment apps.

This opens a payment app with:
- The child’s phone number
- The amount
- An optional message

### Current & Upcoming Providers
- Swish-style deep links (supported)
- More deep link providers planned (MobilePay, Vipps, etc.)

Flow:
**Tap once → Your payment app opens → Confirm → Done**

---

## 🏡 Self-Hosted by Design

- Runs as a Docker container  
- Persistent storage  
- No external cloud backend  
- Ideal for homelab, NAS, or VPS setups  

A discreet **Buy Me a Coffee** link is visible only to parent profiles.

---

## 🚀 Getting Started

### 1. Clone the repository
git clone https://github.com/daevilb/veckopeng.git  
cd veckopeng

### 2. Start via Docker Compose
docker compose up -d

### 3. Open the app
Open your browser and go to:  
http://localhost:3000

On first launch:
1. Create the first parent account  
2. Add your family members  
3. Start creating tasks and rewards

---

## ⚙️ Configuration

Environment variables:

VP_PORT = 3000  
VP_DATA_PATH = /data  

### Example docker-compose.yml
```yaml
services:  
  veckopeng:  
    image: veckopeng:latest  
    container_name: veckopeng  
    ports:  
      - "3000:3000"  
    environment:  
      - VP_PORT=3000  
      - VP_DATA_PATH=/data  
    volumes:  
      - ./data:/data  
    restart: unless-stopped

```

## 🧱 Tech Stack

- React + TypeScript  
- Local/volume-based persistence  
- Node runtime  
- Docker containerization  
- Payment deep links (Swish-style)  
- Responsive UI (mobile + desktop)

---

## 🤝 Contributing

PRs and suggestions are welcome!

The goal is to make Veckopeng:
**As smooth, fun, and useful as possible — while remaining simple to self-host.**

---

## ☕ Support

If you enjoy Veckopeng:
- Use the Buy Me a Coffee link in the app  
- Share the project  
- Suggest features  

Your support helps development continue.

---

## 📜 License

Veckopeng is licensed under **AGPL-3.0**.

- LICENSE → Full AGPL text  
- COMMERCIAL_LICENSE.md → For commercial use outside AGPL terms  

Summary:
✔ Free to use  
✔ Free to modify  
✔ Free to self-host  
❗ Networked deployments must remain open-source  
❗ Commercial closed-source use requires a commercial license  

---

## 🛣️ Roadmap

Upcoming improvements:
- Light / Dark mode  
- Modernized UI  
- Improved onboarding  
- Additional payment providers  
- More tools for families  

Have ideas? Open an issue!
