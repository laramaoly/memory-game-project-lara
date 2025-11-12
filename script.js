const nCards = 8;
let cards = [];
const attemptsSpan = document.getElementById('attempts');
const board = document.getElementById("board")

function createCard(value) {
  const memoryCard = document.createElement("div");
  memoryCard.classList.add("memory-card");
  memoryCard.dataset.cardValue = value;

  const frontFace = document.createElement("div")
  frontFace.classList.add("front-face");
  const backFace = document.createElement("div")
  backFace.classList.add("back-face");

  const frontParagraph = document.createElement("p");
  const backParagraph = document.createElement("p");

  frontParagraph.textContent = value;
  backParagraph.textContent = "?";

  frontFace.appendChild(frontParagraph);
  backFace.appendChild(backParagraph);
  memoryCard.appendChild(frontFace);
  memoryCard.appendChild(backFace);

  return (memoryCard);
}

for (let i = 0; i < nCards; i++) {
  const newCard1 = createCard(i);
  const newCard2 = createCard(i);
  board.appendChild(newCard1);
  board.appendChild(newCard2);
  cards.push(newCard1);
  cards.push(newCard2);
}


let hasFlippedCard = false;
let lockBoard = false; // Bloqueia o tabuleiro para evitar cliques rápidos
let firstCard, secondCard;
let attempts = 0;
let matchedPairs = 0; // Contador de pares encontrados

function flipCard() {
  // Se o tabuleiro estiver bloqueado ou a carta clicada for a mesma, ignora o clique
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add('flip'); // Adiciona a classe 'flip' à carta clicada

  if (!hasFlippedCard) {
    // Primeiro clique
    hasFlippedCard = true;
    firstCard = this;
    return;
  }

  // Segundo clique
  secondCard = this;
  hasFlippedCard = false; // Reseta para o próximo turno

  checkForMatch();
}

function checkForMatch() {
  // Incrementa o contador de tentativas
  attempts++;
  attemptsSpan.textContent = attempts;

  registrarTentativa(); // 🔹 salva estado local a cada tentativa

  // Verifica se os data-attributes das duas cartas são iguais
  let isMatch = firstCard.dataset.cardValue === secondCard.dataset.cardValue;

  // Se for um par, desabilita as cartas. Se não, vira-as de volta.
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  // Remove o ouvinte de evento para que as cartas não possam mais ser clicadas
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);

  // Incrementa o contador de pares
  matchedPairs++;
  // Verifica se o jogo terminou (todos os pares encontrados)
  if (matchedPairs === nCards) {
    // Atraso para o jogador ver a última carta virar
    setTimeout(endGame, 1000);
  }

  resetBoard();
}

function unflipCards() {
  lockBoard = true; // Bloqueia o tabuleiro

  // Após 1.5 segundos, remove a classe 'flip' para virar as cartas de volta
  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');

    resetBoard();
  }, 1500);
}

function resetBoard() {
  // Reseta as variáveis de estado do jogo
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

(function shuffle() {
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * cards.length);
    card.style.order = randomPos;
  });
})();


// Adiciona o evento de clique a cada uma das cartas
cards.forEach(card => card.addEventListener('click', flipCard));


// ===================================================================
// NOVO: FUNÇÕES DE FIM DE JOGO E SALVAMENTO
// ===================================================================

function endGame() {
  // Desabilita o tabuleiro
  lockBoard = true;

  const playerName = prompt(`Parabéns! Você completou o jogo em ${attempts} tentativas.\n\nDigite seu nome para salvar:`);

  if (playerName && playerName.trim() !== "") {
    // Chama o método de salvamento
    saveScoreByAjax(playerName);
    // Para testar o método 2 (formulário), descomente a linha abaixo:
    // saveScoreByForm(playerName);
  } else {
    // Se o usuário cancelar
    alert("Pontuação não salva. Reiniciando o jogo.");
    // MODIFICADO: Redireciona para a página de jogar
    window.location.href = 'index.php?page=jogar';
  }
}

/**
 * MÉTODO 1: Salvar pontuação usando AJAX (Fetch API)
 */
function saveScoreByAjax(playerName) {
  const formData = new FormData();
  formData.append('nome', playerName);
  formData.append('tentativas', attempts);

  console.log("Enviando (AJAX):", playerName, attempts);

  fetch('salvar_pontuacao.php', {
    method: 'POST',
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Resposta do servidor (AJAX):', data.message);

      // MODIFICADO: Redireciona para a página de placar após salvar
      alert("Pontuação salva! Redirecionando para o placar.");
      window.location.href = 'index.php?page=placar';
    })
    .catch(error => {
      console.error('Falha ao salvar pontuação via AJAX:', error);
      alert('Houve um erro ao salvar sua pontuação. Verifique o console.');
      // MODIFICADO: Redireciona de volta para o jogo em caso de erro
      window.location.href = 'index.php?page=jogar';
    });
}


/**
 * MÉTODO 2: Salvar pontuação usando envio de Formulário Oculto (Comentado)
 */
/*
function saveScoreByForm(playerName) {
  console.log("Enviando (Formulário Oculto):", playerName, attempts);

  // Preenche os campos ocultos
  document.getElementById('hiddenName').value = playerName;
  document.getElementById('hiddenAttempts').value = attempts;
  
  // Submete o formulário.
  // O 'salvar_pontuacao.php' foi atualizado para redirecionar
  // para 'index.php?page=placar' após a submissão.
  document.getElementById('scoreForm').submit();
}
*/

// ===============================================================
// PERSISTÊNCIA HÍBRIDA (LOCAL + SERVIDOR)
// ===============================================================
const API_SYNC = "includes/api/sync_estado.php";

// Identificador persistente do jogador
if (!localStorage.getItem('jogador_id')) {
  localStorage.setItem('jogador_id', crypto.randomUUID());
}

// Função: salvar estado local
function salvarEstadoLocal(dados) {
  const payload = {
    jogador_id: localStorage.getItem('jogador_id'),
    estado: dados,
    tentativas: attempts,
    timestamp: Math.floor(Date.now() / 1000)
  };
  localStorage.setItem('estado_jogo', JSON.stringify(payload));
  return payload;
}

// Função: sincronizar com o servidor
async function sincronizarComServidor() {
  const saved = localStorage.getItem('estado_jogo');
  if (!saved) return;
  const payload = JSON.parse(saved);

  try {
    const resp = await fetch(API_SYNC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (data.status === 'ok') {
      console.log('✅ Sincronizado com sucesso:', data);
    } else {
      console.warn('⚠️ Falha na sincronização:', data);
    }
  } catch (err) {
    console.warn('🌐 Offline ou erro de rede:', err);
  }
}

// Inicializa sincronização automática
function iniciarAutoSync() {
  sincronizarComServidor();
  setInterval(sincronizarComServidor, 300000); // a cada 5 min
  window.addEventListener('online', sincronizarComServidor);
}

// Chamamos no início do jogo
iniciarAutoSync();

// ===============================================================
// Exemplo: salvar progresso durante o jogo
// ===============================================================
function registrarTentativa() {
  const estadoAtual = {
    paresEncontrados: matchedPairs,
    tentativasTotais: attempts,
  };
  salvarEstadoLocal(estadoAtual);
}
