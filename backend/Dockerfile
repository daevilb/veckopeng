# Steg 1: Använd en basimage (Node 20 eller liknande)
FROM node:20-alpine

# Sätt arbetsmappen
WORKDIR /app

# Kopiera paketfilerna och installera beroenden
COPY package*.json ./
RUN npm install

# 🛑 DETTA ÄR NYCKELN: Kopiera alla källkodsfiler
COPY . . 

# Steg 2: Starta applikationen
CMD ["npm", "start"]