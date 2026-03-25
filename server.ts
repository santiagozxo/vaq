import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/createPix", async (req, res) => {
    const { firstName, lastName, cpf, phone, amountCents } = req.body;
    const apiKey = process.env.IRONPAY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "IRONPAY_API_KEY not configured" });
    }

    try {
      const payload = {
        amount: amountCents,
        offer_hash: "baYldQj7KvZjNXskbJn2wtn42rhErUrgJZZccOXnoyGOkaRlznLgsixHoaPS",
        payment_method: "pix",
        customer: {
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase().replace(/\s/g, '')}.${lastName.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random() * 1000)}@example.com`,
          phone_number: phone.replace(/\D/g, ''),
          document: cpf.replace(/\D/g, ''),
        },
        cart: [
          {
            product_hash: "u764tekrjx",
            title: "Doação Vaquinha",
            price: amountCents,
            quantity: 1,
            operation_type: 1,
            tangible: false
          }
        ],
        installments: 1,
        expire_in_days: 1,
        transaction_origin: "api"
      };

      console.log("Sending payload to IronPay:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `https://api.ironpayapp.com.br/api/public/v1/transactions?api_token=${apiKey}`,
        payload
      );

      res.json(response.data);
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error("IronPay API Error Details:", JSON.stringify(errorData, null, 2));
      res.status(error.response?.status || 500).json({
        error: "Failed to create PIX transaction",
        details: errorData
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
