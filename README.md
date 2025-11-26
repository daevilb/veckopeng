
# Veckopeng — Homelab-Friendly Chore App with Built-In Payment Integration

A modern, self-hosted family chore & allowance app that automatically opens **Swish**, **Venmo**, or **Cash App** with the payment amount pre-filled.  
Privacy-focused, easy to deploy, and designed for parents who want a simple way to manage chores and weekly allowance at home.

---

## ✨ Features

### 👨‍👩‍👧‍👦 Family Management

- Add parents and children  
- Assign chores  
- Track weekly allowance  
- Approve or deny completed tasks  

### 💸 Built-In Payment Integration

When a parent pays a child:

- The app automatically opens **Swish**, **Venmo**, or **Cash App**
- Amount and phone number & username are pre-filled
- One tap → payment sent  
- No manual typing, no errors  

> Desktop browsers show a disabled button since payment apps only work on mobile.

### 🏡 Homelab Ready

- Fully dockerized
- Uses persistent SQLite storage
- Zero cloud dependencies
- Works offline  

### 🎨 Clean UI

- Light/Dark mode
- Parent/Child dashboards
- Mobile-first responsive layout

---

## 🐳 Installation (Docker Compose)

### 1. Clone the repository

```bash
git clone https://github.com/daevilb/veckopeng.git
cd veckopeng
```

### 2. Copy environment template (NOT IMPLEMENTED YET)

```bash
cp .env.example .env
```

Then edit `.env`:

```env
FAMILY_API_KEY=my-secret-family-key
VITE_API_BASE_URL=http://<your-server-ip>:8090
```

> Never expose Veckopeng publicly without a reverse proxy + proper authentication.

### 3. Start the stack

```bash
docker compose up -d --build
```

### 4. Open the app

Visit:

```
http://<your-server-ip>:4173
```

Enter the **Family Key** you set in `.env`.

---

## ⚙️ Configuration

### Environment variables

| Variable | Description | Required |
|---------|-------------|----------|
| FAMILY_API_KEY | Secret key required by the backend | Yes |
| VITE_API_BASE_URL | Backend URL reachable from the browser | Yes |

### Default ports

| Service | Internal | External |
|---------|----------|----------|
| Backend | 8080 | 8090 |
| Frontend | 80 | 4173 |

---

## 📱 Payment Integrations

### 🇸🇪 Swish
- Mobile deep link  
- Phone + amount pre-filled  
- No external API needed  

### 🇺🇸 Venmo (planned)
- Venmo deep link  
- Pre-filled recipient + amount  

### 🇺🇸 Cash App (planned)
- `$cashtag` + amount pre-filled  

> Desktop → payment buttons disabled.

---

## ❓ Troubleshooting

==== NOT WORKING ====
- Backend protected using a **shared family key**
- Frontend sends the key via `x-family-key`
- Ideal for homelabs and LAN deployments  

```bash
docker compose down
docker compose up -d --build
```

### Frontend cannot reach backend

- Check that `VITE_API_BASE_URL` matches your server IP and port  
- Run:

```bash
docker compose ps
```

### Blank frontend page

```bash
docker compose logs frontend
```

---

## 🤝 Contributing

Contributions, ideas, and bug reports are welcome.

---

## 📜 License

MIT License  
Copyright © Anders Bergvall
