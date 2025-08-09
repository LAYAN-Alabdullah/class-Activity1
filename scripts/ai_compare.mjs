import fs from "fs/promises";

const cars = JSON.parse(await fs.readFile("data/cars.json","utf-8"));

const prompt = `
أمامك قائمة سيارات بصيغة JSON:
${JSON.stringify(cars, null, 2)}

اكتب لي مخرجات بصيغة JSON فقط وبدون نص زائد، بالشكل التالي:
{
  "summary": "ملخص عربي موجز يقارن بين السيارات من حيث السعر والفئة والقيمة",
  "ranking": [
    {"name":"اسم السيارة","reason":"سبب وجيز للتصنيف"},
    {"name":"...","reason":"..."}
  ],
  "tips": "نصائح سريعة لاختيار السيارة بناءً على الميزانية"
}

شروط:
- استنتج بناءً على الاسم والسعر فقط (لا تضف مواصفات لم نعطها).
- كن مختصرًا وواضحًا.
`;

async function callAI(promptText){
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role:"user", content: promptText }],
      temperature: 0.3
    })
  });
  if(!resp.ok){
    const errTxt = await resp.text();
    throw new Error("AI API error: " + errTxt);
  }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "{}";
  return text;
}

const raw = await callAI(prompt);
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  const match = raw.match(/{[\s\S]*}/);
  parsed = match ? JSON.parse(match[0]) : { summary:"لم يتمكن النموذج من توليد JSON صالح." };
}

await fs.mkdir("ai", { recursive: true });
await fs.writeFile("ai/comparison.json", JSON.stringify(parsed, null, 2), "utf-8");
console.log("✅ كتبنا ai/comparison.json");
