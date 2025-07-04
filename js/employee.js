// employee.js
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-request-edit").addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("requestModal")).show();
  });

  document.getElementById("form-request-edit").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("employee_email");
    const date = document.getElementById("request-date").value;
    const reason = document.getElementById("request-reason").value;

    await axios.post("/employee/request_change", {
      funcionario_email: email,
      data_solicitada: date,
      motivo: reason
    }, { headers: { "X-User-Role": "employee" } });

    alert("Solicitação enviada!");
    bootstrap.Modal.getInstance(document.getElementById("requestModal")).hide();
  });
});
