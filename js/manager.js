            O funcionário não informou valores específicos.<br>
            Você precisará verificar manualmente os horários corretos.
          </div>
        `;
        document.getElementById("comparison-section").style.display = "block";
        document.getElementById("quick-action-info").style.display = "none";
      }
    } else {
      document.getElementById("comparison-section").style.display = "none";
      document.getElementById("quick-action-info").style.display = "none";
    }
  }

  // Aprovar solicitação
  document.getElementById("approve-btn").addEventListener("click", async () => {
    await updateRequestStatus("aprovado");
  });

  // Rejeitar solicitação
  document.getElementById("reject-btn").addEventListener("click", async () => {
    await updateRequestStatus("rejeitado");
  });

  // Atualizar status da solicitação
  async function updateRequestStatus(status) {
    const comentario = document.querySelector('textarea[name="comentario"]').value.trim();

    if (!comentario || comentario.length < 5) {
      alert("O comentário é obrigatório e deve ter pelo menos 5 caracteres.");
      return;
    }

    try {
      const managerEmail = localStorage.getItem("employee_email");

      const body = {
        status: status,
        comentario_gerente: comentario,
        gerente_email: managerEmail
      };

      console.log("Processando solicitação:", { requestId: currentRequestId, body });

      await axios.put(`http://168.138.145.22:8080/manager/requests/${currentRequestId}/status`, body);

      alert(`Solicitação ${status} com sucesso!`);
      processModal.hide();

      // Recarregar solicitações
      await loadRequests();

      // Se aprovado, abrir modal de edição automaticamente
      if (status === "aprovado") {
        // Verificar se o usuário quer edição automática
        const autoEdit = document.getElementById("auto-edit-checkbox").checked;

        if (autoEdit) {
          // Buscar detalhes da solicitação para obter o email do funcionário
          const managerEmail = localStorage.getItem("employee_email");
          const res = await axios.get(`${BASE_URL}/manager/requests?manager_email=${encodeURIComponent(managerEmail)}`);
          const pending = Array.isArray(res.data?.pending) ? res.data.pending : [];
          const processed = Array.isArray(res.data?.processed) ? res.data.processed : [];
          const allRequests = [...pending, ...processed];

          const request = allRequests.find(req => req.ID === currentRequestId);

          if (request) {
            // Extrair valores sugeridos novamente
            const suggestedValues = extractSuggestedValues(request.motivo);

            setTimeout(() => {
              editLogs(request.funcionario_email, suggestedValues, request.data_solicitada);
            }, 500);
          }
        }
      }

    } catch (err) {
      console.error("Erro ao processar solicitação:", err);
      const errorMsg = err.response?.data?.error || "Erro ao processar solicitação.";
      alert(errorMsg);
    }
  }

  // Torna a função editLogs global para ser acessível pelo HTML
  window.editLogs = async function(email, suggestedValues = null, requestDate = null) {
    currentEmail = email;
    try {
      const res = await axios.get(`${BASE_URL}/time_logs?employee_email=${email}`);
      logsCache = res.data;

      if (!logsCache.length) return alert("Sem registros!");

      // Se foi especificada uma data, busca o registro dessa data
      let targetLog = logsCache[0]; // Mais recente por padrão
      if (requestDate) {
        const requestDateStr = new Date(requestDate).toISOString().split('T')[0];
        const foundLog = logsCache.find(log => {
          const logDateStr = new Date(log.log_date).toISOString().split('T')[0];
          return logDateStr === requestDateStr;
        });
        if (foundLog) {
          targetLog = foundLog;
        }
      }

      // Função para converter horário HH:MM para datetime-local
      const timeToDatetime = (timeStr, baseDate) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(':');
        const date = new Date(baseDate);
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date.toISOString().slice(0, 16);
      };

      // Se há valores sugeridos, usa eles; senão usa os valores atuais
      let entryValue = targetLog.entry_time;
      let lunchExitValue = targetLog.lunch_exit_time;
      let lunchReturnValue = targetLog.lunch_return_time;
      let exitValue = targetLog.exit_time;
      let prefilledReason = "";

      if (suggestedValues && Object.keys(suggestedValues).length > 0) {
        const baseDate = targetLog.log_date;

        if (suggestedValues.entry) {
          entryValue = timeToDatetime(suggestedValues.entry, baseDate);
        }
        if (suggestedValues.lunchExit) {
          lunchExitValue = timeToDatetime(suggestedValues.lunchExit, baseDate);
        }
        if (suggestedValues.lunchReturn) {
          lunchReturnValue = timeToDatetime(suggestedValues.lunchReturn, baseDate);
        }
        if (suggestedValues.exit) {
          exitValue = timeToDatetime(suggestedValues.exit, baseDate);
        }

        prefilledReason = "Alteração aprovada conforme solicitação do funcionário com valores sugeridos.";
      }

      editFields.innerHTML = `
        <div class="col-12 mb-3">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i> <strong>Editando registro de:</strong> ${new Date(targetLog.log_date).toLocaleDateString('pt-BR')}
            ${suggestedValues ? '<br><small><i class="fas fa-lightbulb"></i> Valores sugeridos pelo funcionário foram pré-preenchidos</small>' : ''}
          </div>
        </div>
        ${formatInput("Entrada", entryValue, "entry_time")}
        ${formatInput("Saída Almoço", lunchExitValue, "lunch_exit_time")}
        ${formatInput("Retorno Almoço", lunchReturnValue, "lunch_return_time")}
        ${formatInput("Saída", exitValue, "exit_time")}
        <div class="col-12 mt-3">
          <label class="form-label"><strong>Motivo da Alteração *</strong></label>
          <textarea class="form-control" name="motivo_edicao" rows="3" required
                    placeholder="Descreva o motivo da alteração (obrigatório)...">${prefilledReason}</textarea>
        </div>
      `;
      modal.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar registros.");
    }
  };

  // Formulário de edição
  document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.elements;
    const managerEmail = localStorage.getItem("employee_email");

    // Validação do motivo
    const motivo = inputs.motivo_edicao.value.trim();
    if (!motivo || motivo.length < 5) {
      alert("O motivo da alteração é obrigatório e deve ter pelo menos 5 caracteres.");
      return;
    }

    const body = {
      entry_time: inputs.entry_time.value,
      lunch_exit_time: inputs.lunch_exit_time.value,
      lunch_return_time: inputs.lunch_return_time.value,
      exit_time: inputs.exit_time.value,
      motivo_edicao: motivo,
      manager_email: managerEmail
    };

    try {
      const id = logsCache[0].ID || logsCache[0].id;
      console.log("Enviando edição:", body);

      await axios.put(`${BASE_URL}/time_logs/${id}/manual_edit`, body);
      alert("Alterações salvas com sucesso!");
      modal.hide();

      // Limpar o formulário
      inputs.motivo_edicao.value = "";
    } catch (err) {
      console.error("Erro ao salvar:", err);
      const errorMsg = err.response?.data || "Erro ao salvar alterações.";
      alert(errorMsg);
    }
  });

  // Botão exportar por período
  const btnExportRange = document.getElementById("btn-export-range");
  if (btnExportRange) {
    btnExportRange.addEventListener("click", () => {
      exportModal.show();
    });
  }

  // Formulário de exportação por período
  const formExport = document.getElementById("form-export");
  if (formExport) {
    formExport.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("export-email").value;
      const start = document.getElementById("export-start").value;
      const end = document.getElementById("export-end").value;

      if (!email || !start || !end) {
        alert("Preencha todos os campos!");
        return;
      }

      const url = `${BASE_URL}/time_logs/export_range?employee_email=${encodeURIComponent(email)}&start=${start}&end=${end}`;
      window.open(url, "_blank");
      exportModal.hide();
    });
  }

  // Logout
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Deseja realmente sair?")) {
        localStorage.clear();
        window.location.href = "index.html";
      }
    });
  }

  // Atualização automática das solicitações a cada 30 segundos
  setInterval(loadRequests, 3000000);

  // Carrega dados ao inicializar
  fetchEmployees();
  loadRequests();
});
