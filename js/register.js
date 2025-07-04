document.addEventListener("DOMContentLoaded", function () {
const BASE_URL = 'https://marcatempo.online'; 
    // Formulário de redirecionamento para a página de registro
    const redirectForm = document.getElementById('nregister');
    if (redirectForm) {
        redirectForm.addEventListener('submit', function (e) {
            e.preventDefault();
            window.location.href = "register.html";
        });
    }

    // Formulário de registro de funcionário
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('register-password').value;

            const employee = {
                name: document.getElementById('register-name').value,
                cpf: document.getElementById('register-cpf').value,
                rg: document.getElementById('register-rg').value,
                email: document.getElementById('register-email').value,
                age: parseInt(document.getElementById('register-age').value, 10),
                workload: parseFloat(document.getElementById('register-workload').value),
                active: document.getElementById('register-active').value === "true",
                company_cnpj: document.getElementById('register-cnpj').value,
                password: password
            };

            try {
                // Mostra mensagem de carregamento
                const messageElement = document.createElement('div');
                messageElement.className = 'alert alert-info mt-3';
                messageElement.textContent = 'Registrando funcionário...';
                registerForm.appendChild(messageElement);

                // Cria o funcionário
                const employeeResponse = await axios.post(`${BASE_URL}/employee/`, employee);

                if (employeeResponse.status === 200 || employeeResponse.status === 201) {
                    // Cria ou atualiza a senha
                    const passwordResponse = await axios.post(`${BASE_URL}/login/password`, {
                        email: employee.email,
                        password: password
                    });

                    if (passwordResponse.status === 200) {
                        messageElement.className = 'alert alert-success mt-3';
                        messageElement.textContent = 'Funcionário e senha cadastrados com sucesso! Redirecionando para o login...';
                        
                        // Redireciona para o login após um breve delay
                        setTimeout(() => {
                            window.location.href = "index.html"; // Redirecionando para a página de login
                        }, 2000);
                    } else {
                        throw new Error('Falha ao registrar senha');
                    }
                } else {
                    throw new Error('Falha ao criar funcionário');
                }
            } catch (error) {
                // Mostra mensagem de erro
                const messageElement = document.createElement('div');
                messageElement.className = 'alert alert-danger mt-3';
                
                if (error.response && error.response.data) {
                    messageElement.textContent = error.response.data;
                } else {
                    messageElement.textContent = 'Erro ao registrar o funcionário. Verifique os dados e tente novamente.';
                }
                
                // Remove qualquer mensagem anterior
                const previousMessage = document.querySelector('#register-form .alert');
                if (previousMessage) {
                    previousMessage.remove();
                }
                
                registerForm.appendChild(messageElement);
                console.error(error);
            }
        });
    }
});
