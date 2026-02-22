export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
}

export interface EmailMessageDetail extends EmailMessage {
  attachments: unknown[];
  body: string;
  textBody: string;
  htmlBody: string;
}

const API_BASE = "https://api.mail.tm";

// Keep token in memory for the current session
let currentToken = "";

export async function getTempEmail(): Promise<string> {
  const domRes = await fetch(`${API_BASE}/domains`);
  if (!domRes.ok) throw new Error("Failed to fetch temp email domains");
  const domData = await domRes.json();
  const domain = domData["hydra:member"][0].domain;

  const address = `dev${Math.random().toString(36).substring(2, 10)}@${domain}`;
  const securePhrase = "password123";

  // Create account
  const accRes = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password: securePhrase })
  });

  if (!accRes.ok) throw new Error("Failed to create temp mailbox");

  // Get token
  const tokRes = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password: securePhrase })
  });
  
  if (!tokRes.ok) throw new Error("Failed to retrieve mailbox session");

  const tokData = await tokRes.json();
  currentToken = tokData.token;

  return address;
}

export async function getMessages(email: string): Promise<EmailMessage[]> {
  if (!email || !currentToken) return [];

  const res = await fetch(`${API_BASE}/messages`, {
    headers: { Authorization: `Bearer ${currentToken}` },
    cache: 'no-store'
  });
  
  if (!res.ok) throw new Error("Failed to fetch messages");
  
  const data = await res.json();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data["hydra:member"].map((m: any) => ({
    id: m.id,
    from: m.from.address,
    subject: m.subject,
    date: m.createdAt
  }));
}

export async function getMessageData(email: string, messageId: string): Promise<EmailMessageDetail | null> {
  if (!email || !currentToken) return null;

  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
     headers: { Authorization: `Bearer ${currentToken}` },
     cache: 'no-store'
  });
  
  if (!res.ok) throw new Error("Failed to fetch message details");
  
  const data = await res.json();
  return {
    id: data.id,
    from: data.from.address,
    subject: data.subject,
    date: data.createdAt,
    attachments: data.attachments || [],
    body: data.intro,
    textBody: data.text,
    htmlBody: data.html && data.html.length > 0 ? data.html[0] : ""
  };
}
