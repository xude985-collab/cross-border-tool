const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function importProducts(urls: string[], batchName: string, priceMultiplier: number) {
  const res = await fetch(`${API_URL}/api/products/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, batch_name: batchName, price_multiplier: priceMultiplier }),
  });
  return res.json();
}

export async function getBatchProducts(batchId: number) {
  const res = await fetch(`${API_URL}/api/products/batch/${batchId}`);
  return res.json();
}

export async function getProduct(productId: number) {
  const res = await fetch(`${API_URL}/api/products/${productId}`);
  return res.json();
}

export async function updateProduct(productId: number, updates: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function batchUpload(productIds: number[]) {
  const res = await fetch(`${API_URL}/api/upload/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_ids: productIds }),
  });
  return res.json();
}

export async function getBatches() {
  const res = await fetch(`${API_URL}/api/batches/`);
  return res.json();
}

export async function getBatchStats(batchId: number) {
  const res = await fetch(`${API_URL}/api/batches/${batchId}/stats`);
  return res.json();
}
