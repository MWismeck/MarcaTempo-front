document.addEventListener("DOMContentLoaded", () => {
const BASE_URL = 'https://marcatempo.online';
    const employeeEmail = localStorage.getItem("employee_email");
    const employeeName = localStorage.getItem("employee_name");
    const role = localStorage.getItem("role");
    const activeSession = localStorage.getItem("session_active");

    if (!employeeEmail || !employeeName || !role || activeSession !== "true") {
        alert("Sessão inválida ou expirada. Faça login novamente.");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
        return;
    }

    const email = employeeEmail;
    const nome = employeeName;
    const table = document.getElementById("time-logs-table-body");

    // Mostrar nome do usuário
    const userNomeEl = document.getElementById("employee-name");
    if (userNomeEl) userNomeEl.innerText = `Bem-vindo, ${nome}`;

    // Carrega pontos no HTML
    async function carregarPontos() {
        try {
            const res = await axios.get(`${BASE_URL}/time_logs?employee_email=${encodeURIComponent(email)}`);
            table.innerHTML = "";

            if (!res.data || res.data.length === 0) {
                table.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum ponto registrado ainda.</td></tr>`;
                return;
            }

            res.data.forEach(log => {
               if (
        (!log.entry_time || log.entry_time === "0001-01-01T00:00:00Z") &&
        (!log.exit_time || log.exit_time === "0001-01-01T00:00:00Z") &&
        (!log.lunch_exit_time || log.lunch_exit_time === "0001-01-01T00:00:00Z") &&
        (!log.lunch_return_time || log.lunch_return_time === "0001-01-01T00:00:00Z")
    ) {
        return;
    }
                const row = document.createElement("tr");
                //const logDate = new Date(log.log_date || log.created.at).toLocaleDateString('pt-BR');
                 const rawDate = log.log_date && log.log_date !== "0001-01-01T00:00:00Z" 
                    ? log.log_date 
                    : log.created_at;

                 const logDate = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : "Data inválida";
                

                // Função para formatar horário com indicação de edição
                const formatTimeWithEdit = (timeStr, isEdited) => {
  if (!timeStr || timeStr === "0001-01-01T00:00:00Z") return "-";

  // Evita fuso horário completamente: formata HH:MM direto da string ISO
  const raw = timeStr.split("T")[1]?.substring(0, 5) || "00:00";
  const horaMinuto = raw;

  return isEdited ? `${horaMinuto} <span class="text-warning">*</span>` : horaMinuto;
};


                
                const isEdited = log.editado_por_gerente && log.editado_por_gerente.trim() !== "";
                
                // Os horários já vêm atualizados do banco (são os novos horários após edição)
                const entryTime = formatTimeWithEdit(log.entry_time, isEdited);
                const lunchExitTime = formatTimeWithEdit(log.lunch_exit_time, isEdited);
                const lunchReturnTime = formatTimeWithEdit(log.lunch_return_time, isEdited);
                const exitTime = formatTimeWithEdit(log.exit_time, isEdited);
                const balance = log.balance ? log.balance.toFixed(2) : "0.00";
                
                // Coluna de status
                let statusColumn = '<span class="badge bg-success">Original</span>';
                if (isEdited) {
                    const editDate = new Date(log.editado_em).toLocaleDateString('pt-BR');
                    const editTime = new Date(log.editado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
                    statusColumn = `
                        <span class="badge bg-warning text-dark" 
                              title="Editado por: ${log.editado_por_gerente}&#10;Data: ${editDate} às ${editTime}&#10;Motivo: ${log.motivo_edicao || 'Não informado'}"
                              data-bs-toggle="tooltip" data-bs-html="true">
                            <i class="bi bi-pencil"></i> Editado
                        </span>
                    `;
                }
                
                // Adiciona classe especial para linhas editadas
                if (isEdited) {
                    row.classList.add("table-warning", "border-warning");
                }
                
                row.innerHTML = `
                    <td>${logDate}</td>
                    <td>${entryTime}</td>
                    <td>${lunchExitTime}</td>
                    <td>${lunchReturnTime}</td>
                    <td>${exitTime}</td>
                    <td class="${log.balance >= 0 ? 'text-success' : 'text-danger'}">${balance}h</td>
                    <td>${statusColumn}</td>
                `;
                table.appendChild(row);
            });
            
            // Inicializar tooltips do Bootstrap
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        } catch (err) {
            console.error("Erro ao carregar pontos:", err);
            table.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Erro ao carregar pontos.</td></tr>`;
        }
    }

    // Registrar ponto
    const registerBtn = document.getElementById("register-time-btn");
    if (registerBtn) {
        registerBtn.addEventListener("click", async () => {
            try {
                const statusDiv = document.getElementById("status-message");
                statusDiv.innerHTML = '<div class="alert alert-info">Registrando ponto...</div>';
                
                const res = await axios.put(`${BASE_URL}/time_logs/1?employee_email=${encodeURIComponent(email)}`);
                
                if (res.status === 200 || res.status === 201) {
                    statusDiv.innerHTML = '<div class="alert alert-success">Ponto registrado com sucesso!</div>';
                    setTimeout(() => {
                        statusDiv.innerHTML = '';
                    }, 3000);
                    carregarPontos(); // Recarrega a tabela
                }
            } catch (err) {
                console.error("Erro ao registrar ponto:", err);
                const statusDiv = document.getElementById("status-message");
                statusDiv.innerHTML = '<div class="alert alert-danger">Erro ao registrar ponto. Tente novamente.</div>';
                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 5000);
            }
        });
    }

    // Exportar Excel
    const exportBtn = document.getElementById("export-excel-btn");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            window.open(`${BASE_URL}/time_logs/export?employee_email=${encodeURIComponent(email)}`, "_blank");
        });
    }

    // Botão de suporte (WhatsApp)
    const problemsBtn = document.getElementById("problems-btn");
    if (problemsBtn) {
        problemsBtn.addEventListener("click", () => {
            const message = encodeURIComponent("Olá! Preciso de ajuda com o sistema de ponto.");
            window.open(`https://wa.me/5511999999999?text=${message}`, "_blank");
        });
    }

    // Botão sair
    const exitBtn = document.getElementById("exit-btn");
    if (exitBtn) {
        exitBtn.addEventListener("click", () => {
            if (confirm("Deseja realmente sair do sistema?")) {
                localStorage.clear();
                window.location.href = "index.html";
            }
        });
    }

    let timeLogsData = []; // Cache dos dados de ponto

    // Botão para abrir modal de solicitação
    const btnRequestEdit = document.getElementById("btn-request-edit");
    if (btnRequestEdit) {
        btnRequestEdit.addEventListener("click", async () => {
            try {
                const res = await axios.get(`${BASE_URL}/time_logs?employee_email=${encodeURIComponent(email)}`);
                
                if (!res.data || res.data.length === 0) {
                    alert("Você ainda não possui pontos registrados para solicitar alteração.");
                    return;
                }

                timeLogsData = res.data;
                
                // Preenche o select com as datas disponíveis
                const dateSelect = document.getElementById("request-date-select");
                dateSelect.innerHTML = '<option value="">Selecione a data...</option>';
                
                timeLogsData.forEach(log => {
                    const logDate = new Date(log.log_date);
                    const dateStr = logDate.toISOString().split('T')[0];
                    const displayDate = logDate.toLocaleDateString('pt-BR');
                    dateSelect.innerHTML += `<option value="${dateStr}" data-log-id="${log.ID}">${displayDate}</option>`;
                });
                
                // Mostra o modal
                const modal = new bootstrap.Modal(document.getElementById("requestModal"));
                modal.show();
            } catch (err) {
                alert("Erro ao carregar pontos para solicitação.");
                console.error(err);
            }
        });
    }

    // Quando seleciona uma data, mostra os valores atuais
    const dateSelect = document.getElementById("request-date-select");
    if (dateSelect) {
        dateSelect.addEventListener("change", (e) => {
            const selectedDate = e.target.value;
            const logId = e.target.selectedOptions[0]?.dataset.logId;
            
            if (selectedDate && logId) {
                const selectedLog = timeLogsData.find(log => log.ID == logId);
                if (selectedLog) {
                    showCurrentValues(selectedLog);
                }
            } else {
                document.getElementById("current-values-display").style.display = "none";
            }
        });
    }

    // Função para mostrar valores atuais
    function showCurrentValues(log) {
        const currentValuesDiv = document.getElementById("current-values-display");
        const contentDiv = document.getElementById("current-values-content");
        
        const formatTime = (timeStr) => {
            if (!timeStr || timeStr === "0001-01-01T00:00:00Z") return "Não registrado";
            return new Date(timeStr).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
        };
        
        contentDiv.innerHTML = `
            <div class="row">
                <div class="col-md-3"><strong>Entrada:</strong> ${formatTime(log.entry_time)}</div>
                <div class="col-md-3"><strong>Saída Almoço:</strong> ${formatTime(log.lunch_exit_time)}</div>
                <div class="col-md-3"><strong>Retorno:</strong> ${formatTime(log.lunch_return_time)}</div>
                <div class="col-md-3"><strong>Saída:</strong> ${formatTime(log.exit_time)}</div>
            </div>
        `;
        
        currentValuesDiv.style.display = "block";
    }

    // Checkbox para mostrar/ocultar valores sugeridos
    const showSuggestedCheckbox = document.getElementById("show-suggested-values");
    if (showSuggestedCheckbox) {
        showSuggestedCheckbox.addEventListener("change", (e) => {
            const suggestedDiv = document.getElementById("suggested-values");
            suggestedDiv.style.display = e.target.checked ? "block" : "none";
        });
    }

    // Envia solicitação de alteração
    const formRequestEdit = document.getElementById("form-request-edit");
    if (formRequestEdit) {
        formRequestEdit.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const dataSelecionada = document.getElementById("request-date-select").value;
            const tipoAlteracao = document.getElementById("request-type").value;
            const motivo = document.getElementById("request-reason").value;

            if (!dataSelecionada || !tipoAlteracao || motivo.trim().length < 10) {
                return alert("Preencha todos os campos obrigatórios. O motivo deve ter pelo menos 10 caracteres.");
            }

            // Monta o motivo detalhado
            let motivoCompleto = `TIPO: ${document.getElementById("request-type").selectedOptions[0].text}\n\n`;
            motivoCompleto += `MOTIVO: ${motivo}`;

            // Se informou valores sugeridos, adiciona ao motivo
            const showSuggested = document.getElementById("show-suggested-values").checked;
            if (showSuggested) {
                const suggestedEntry = document.getElementById("suggested-entry").value;
                const suggestedLunchExit = document.getElementById("suggested-lunch-exit").value;
                const suggestedLunchReturn = document.getElementById("suggested-lunch-return").value;
                const suggestedExit = document.getElementById("suggested-exit").value;

                motivoCompleto += "\n\nVALORES CORRETOS SUGERIDOS:";
                if (suggestedEntry) motivoCompleto += `\n- Entrada: ${suggestedEntry}`;
                if (suggestedLunchExit) motivoCompleto += `\n- Saída Almoço: ${suggestedLunchExit}`;
                if (suggestedLunchReturn) motivoCompleto += `\n- Retorno Almoço: ${suggestedLunchReturn}`;
                if (suggestedExit) motivoCompleto += `\n- Saída: ${suggestedExit}`;
            }

            try {
                await axios.post(`${BASE_URL}/employee/request_change`, {
                    funcionario_email: email,
                    data_solicitada: new Date(dataSelecionada).toISOString(),
                    motivo: motivoCompleto
                });

                alert("Solicitação enviada com sucesso! O gerente receberá todas as informações detalhadas.");
                const modal = bootstrap.Modal.getInstance(document.getElementById("requestModal"));
                modal.hide();
                
                // Limpa o formulário
                document.getElementById("request-reason").value = "";
                document.getElementById("request-date-select").value = "";
                document.getElementById("request-type").value = "";
                document.getElementById("show-suggested-values").checked = false;
                document.getElementById("suggested-values").style.display = "none";
                document.getElementById("current-values-display").style.display = "none";
                
                // Limpa campos de valores sugeridos
                document.getElementById("suggested-entry").value = "";
                document.getElementById("suggested-lunch-exit").value = "";
                document.getElementById("suggested-lunch-return").value = "";
                document.getElementById("suggested-exit").value = "";
            } catch (err) {
                console.error("Erro ao enviar solicitação:", err);
                alert("Erro ao enviar solicitação. Tente novamente.");
            }
        });
    }

    // Carrega pontos ao inicializar
    carregarPontos();
});
