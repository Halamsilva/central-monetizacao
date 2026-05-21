import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

type KiwifyAccessStatus = "pending" | "active" | "blocked";

const normalizeEmail = (email?: unknown) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getNestedValue = (source: any, paths: string[]) => {
  for (const pathKey of paths) {
    const value = pathKey
      .split(".")
      .reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), source);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const findEmail = (source: any): string => {
  const directEmail = getNestedValue(source, [
    "Customer.email",
    "customer.email",
    "client.email",
    "buyer.email",
    "data.customer.email",
    "data.buyer.email",
    "order.customer.email",
    "subscription.customer.email",
    "email",
  ]);

  if (directEmail) return normalizeEmail(directEmail);

  if (!source || typeof source !== "object") return "";

  for (const value of Object.values(source)) {
    if (value && typeof value === "object") {
      const email = findEmail(value);
      if (email) return email;
    }
  }

  return "";
};

const normalizeEventName = (event: unknown) =>
  String(event || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getKiwifyEvent = (payload: any) =>
  normalizeEventName(
    getNestedValue(payload, [
      "webhook_event_type",
      "event",
      "event_type",
      "trigger",
      "type",
      "status",
      "order_status",
      "data.status",
      "order.status",
    ]) || ""
  );

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === "production";

  app.use(express.json());

  // Gemini Proxy Endpoint (Server-Side)
  // This keeps the API key safe from the browser
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const genAI = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const result = await genAI.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction
        }
      });
      
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/webhooks/kiwify", async (req, res) => {
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;
    const receivedToken =
      req.header("x-kiwify-token") ||
      req.header("x-webhook-token") ||
      req.query.token ||
      req.body?.token ||
      req.body?.webhook_token ||
      req.body?.webhook?.token;

    if (!webhookToken) {
      return res.status(500).json({ error: "KIWIFY_WEBHOOK_TOKEN is not configured" });
    }

    if (receivedToken !== webhookToken) {
      return res.status(401).json({ error: "Invalid webhook token" });
    }

    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });
    }

    const event = getKiwifyEvent(req.body);
    const email = findEmail(req.body);

    if (!email) {
      return res.status(400).json({ error: "Customer email not found in webhook payload" });
    }

    const purchaseId = String(
      getNestedValue(req.body, ["order_id", "sale_id", "id", "data.id", "order.id", "transaction.id"]) || email
    );
    const productId = String(getNestedValue(req.body, ["product.id", "product_id", "data.product.id"]) || "");
    const paidAtValue = getNestedValue(req.body, [
      "paid_at",
      "approved_at",
      "created_at",
      "data.paid_at",
      "order.created_at",
    ]);
    const paidAt = paidAtValue ? new Date(String(paidAtValue)) : new Date();
    const releaseDelayDays = Number(process.env.KIWIFY_RELEASE_DELAY_DAYS || 7);
    const releaseAt = addDays(Number.isNaN(paidAt.getTime()) ? new Date() : paidAt, releaseDelayDays);
    const isReleased = releaseAt.getTime() <= Date.now();

    const revokedEvents = [
      "reembolso",
      "compra_reembolsada",
      "order_refunded",
      "chargeback",
      "assinatura_cancelada",
      "assinatura_atrasada",
      "subscription_canceled",
      "subscription_late",
      "refunded",
      "canceled",
      "late",
    ];
    const approvedEvents = [
      "compra_aprovada",
      "order_approved",
      "assinatura_renovada",
      "subscription_renewed",
      "approved",
      "paid",
    ];

    let accessStatus: KiwifyAccessStatus | null = null;

    if (revokedEvents.includes(event)) {
      accessStatus = "blocked";
    }

    if (approvedEvents.includes(event)) {
      accessStatus = isReleased ? "active" : "pending";
    }

    if (!accessStatus) {
      return res.json({ ok: true, ignored: true, event });
    }

    const { error: purchaseError } = await serviceSupabase
      .from("kiwify_purchases")
      .upsert(
        {
          email,
          kiwify_order_id: purchaseId,
          product_id: productId || null,
          purchase_status: accessStatus,
          paid_at: paidAt.toISOString(),
          release_at: releaseAt.toISOString(),
          raw_payload: req.body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (purchaseError) {
      console.error("Kiwify purchase upsert error:", purchaseError);
      return res.status(500).json({ error: "Failed to save purchase" });
    }

    const profileUpdate: Record<string, string | null> = {
      access_status: accessStatus,
    };

    if (accessStatus === "active") {
      profileUpdate.approved_at = new Date().toISOString();
    }

    if (accessStatus === "pending") {
      profileUpdate.approved_at = null;
    }

    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .update(profileUpdate)
      .eq("email", email)
      .eq("role", "student");

    if (profileError) {
      console.error("Kiwify profile update error:", profileError);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.json({
      ok: true,
      event,
      email,
      access_status: accessStatus,
      release_at: releaseAt.toISOString(),
    });
  });

  app.post("/api/access/sync", async (req, res) => {
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });
    }

    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const {
      data: { user },
      error: authError,
    } = await serviceSupabase.auth.getUser(token);

    if (authError || !user?.email) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const email = normalizeEmail(user.email);
    const { data: purchase, error: purchaseError } = await serviceSupabase
      .from("kiwify_purchases")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (purchaseError) {
      console.error("Access sync purchase error:", purchaseError);
      return res.status(500).json({ error: "Failed to check purchase" });
    }

    if (!purchase) {
      return res.json({ ok: true, access_status: "pending" });
    }

    const releaseAt = new Date(purchase.release_at);
    const nextStatus: KiwifyAccessStatus =
      purchase.purchase_status === "blocked"
        ? "blocked"
        : releaseAt.getTime() <= Date.now()
          ? "active"
          : "pending";

    if (nextStatus === "active" && purchase.purchase_status !== "active") {
      await serviceSupabase
        .from("kiwify_purchases")
        .update({ purchase_status: "active", updated_at: new Date().toISOString() })
        .eq("email", email);
    }

    const profileUpdate: Record<string, string | null> = {
      access_status: nextStatus,
    };

    if (nextStatus === "active") {
      profileUpdate.approved_at = new Date().toISOString();
    }

    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id)
      .eq("role", "student");

    if (profileError) {
      console.error("Access sync profile error:", profileError);
      return res.status(500).json({ error: "Failed to update access" });
    }

    return res.json({
      ok: true,
      access_status: nextStatus,
      release_at: purchase.release_at,
    });
  });

  if (!isProd) {
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
