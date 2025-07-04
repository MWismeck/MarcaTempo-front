document.addEventListener("DOMContentLoaded", () => {
const BASE_URL = 'https://marcatempo.online';
  // Cadastrar Empresa
  const formCompany = document.getElementById("form-company");
  formCompany.addEventListener("submit", async (e) => {
    e.preventDefault();

    const companyData = {
      name: document.getElementById("company-name").value,
      cnpj: document.getElementById("company-cnpj").value,
      email: document.getElementById("company-email").value,
      fone: document.getElementById("company-phone").value,
      active: document.getElementById("company-active").value === "true",
    };

    try {
      const response = await axios.post(`${BASE_URL}/admin/create_company`, companyData);
      alert("Empresa cadastrada com sucesso!");
      formCompany.reset();
    } catch (err) {
      console.error("Erro ao cadastrar empresa:", err);
      alert("Erro ao cadastrar empresa: " + (err.response?.data?.error || err.message));
    }
  });

  // Cadastrar Gerente
  const formManager = document.getElementById("form-manager");
  formManager.addEventListener("submit", async (e) => {
    e.preventDefault();

    const managerData = {
      name: document.getElementById("manager-name").value,
      cpf: document.getElementById("manager-cpf").value,
      rg: document.getElementById("manager-rg").value,
      email: document.getElementById("manager-email").value,
      age: parseInt(document.getElementById("manager-age").value),
      active: document.getElementById("manager-active").value === "true",
      workload: parseFloat(document.getElementById("manager-workload").value),
      password: document.getElementById("manager-password").value,
      company_cnpj: document.getElementById("manager-cnpj").value,
    };

    try {
      const response = await axios.post(`${BASE_URL}/admin/create_manager`, managerData);
      alert("Gerente cadastrado com sucesso!");
      formManager.reset();
    } catch (err) {
      console.error("Erro ao cadastrar gerente:", err);
      alert("Erro ao cadastrar gerente: " + (err.response?.data?.error || err.message));
    }
  });

  // Carregar Empresas e Gerentes
  document.getElementById("btn-load-data").addEventListener("click", async () => {
    try {
      const [companies, managers] = await Promise.all([
        axios.get(`${BASE_URL}/admin/companies`),
        axios.get(`${BASE_URL}/admin/managers`),
      ]);

      let html = `<h5>Empresas</h5><ul class="list-group mb-3">`;
      companies.data.forEach((company) => {
        html += `<li class="list-group-item">${company.name} - CNPJ: ${company.cnpj}</li>`;
      });
      html += `</ul><h5>Gerentes</h5><ul class="list-group">`;
      managers.data.forEach((manager) => {
        html += `<li class="list-group-item">${manager.name} (${manager.email})</li>`;
      });
      html += `</ul>`;

      document.getElementById("list-data").innerHTML = html;
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      alert("Erro ao carregar dados.");
    }
  });

  // Logout
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
});
