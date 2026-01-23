// Script para testar a API diretamente
const apiUrl = "http://localhost:3000/unidades/lista-completa";

console.log("🧪 Testando API em:", apiUrl);

fetch(apiUrl, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((res) => {
    console.log("📦 Status:", res.status);
    console.log("📦 Headers:", res.headers);
    return res.json();
  })
  .then((data) => {
    console.log("✅ Resposta:", JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("❌ Erro:", error);
  });
