document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const BASE_URL = 'http://168.138.145.22:8080';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await axios.post(`${BASE_URL}/login`, { email, password });

        if (response.status === 200) {
            const data = response.data;
            localStorage.setItem('employee_email', data.employee_email);
            localStorage.setItem('employee_id', data.employee_id || "");
            localStorage.setItem('employee_name', data.employee_name || "");
            localStorage.setItem('role', data.role || "");
            localStorage.setItem('session_active', "true");

            const messageElement = document.createElement('div');
            messageElement.className = 'alert alert-success mt-3';
            messageElement.textContent = 'Login realizado com sucesso! Redirecionando...';
            document.getElementById('login-form').appendChild(messageElement);

            if (data.role === "manager") {
                const escolha = confirm("Você deseja acessar o painel do gerente?\nClique em 'Cancelar' para registrar ponto como funcionário.");
                window.location.href = escolha ? "manager.html" : "time-registration.html";
            } else if (data.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "time-registration.html";
            }
        }

    } catch (err) {
        const messageElement = document.createElement('div');
        messageElement.className = 'alert alert-danger mt-3';
        messageElement.textContent = err.response?.data || 'Erro ao realizar login. Verifique suas credenciais.';

        const previousMessage = document.querySelector('#login-form .alert');
        if (previousMessage) {
            previousMessage.remove();
        }

        document.getElementById('login-form').appendChild(messageElement);
        console.error(err);
    }
});
