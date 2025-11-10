// Temporary in-memory store (replace with DB later)
const CLIENTS = [];

export function listClients(_req, res) {
  res.json(CLIENTS);
}

export function createClient(req, res) {
  const { name, email, phone } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });

  const client = {
    id: String(CLIENTS.length + 1),
    name,
    email: email || null,
    phone: phone || null,
    createdAt: new Date().toISOString(),
  };
  CLIENTS.push(client);
  res.status(201).json(client);
}
