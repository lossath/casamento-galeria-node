// ===================================================================
// CONFIGURAÇÕES GLOBAIS
// ===================================================================

const API_URL = 'http://localhost:3000'; // ENDEREÇO DO SERVIDOR NODE.JS (Mudar na hospedagem!)
const ITEMS_PER_PAGE = 20;               // Quantos itens mostrar por clique em "Ver Mais"

let allMedia = [];       // Armazena a lista COMPLETA de arquivos (nomes de arquivo do servidor)
let currentIndex = 0;    // Índice de controle da paginação (onde paramos de exibir)
let currentMediaList = []; // Lista de TODAS as URLs atualmente carregadas na galeria
let currentMediaIndex = -1; // O índice da mídia atualmente aberta no modal

// ===================================================================
// INICIALIZAÇÃO (Executada após o DOM carregar)
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Variáveis do DOM ---
    const form = document.getElementById('uploadForm');
    const galeria = document.getElementById('galeria-convidados');
    const uploadFeedback = document.getElementById('uploadFeedback');
    const verMaisBtn = document.getElementById('verMaisBtn');
    
    // Elementos de Upload
    const fileInput = document.getElementById('file-upload');
    const fileLabel = document.getElementById('file-label');

    // Capturando o elemento do botão de download
const downloadBtn = document.getElementById('downloadBtn'); 

    // Elementos do Modal (Lightbox)
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const modalVideo = document.getElementById('video01');
    const closeModalBtn = document.getElementsByClassName('close-btn')[0];
    const prevBtn = document.getElementsByClassName('prev-btn')[0];
    const nextBtn = document.getElementsByClassName('next-btn')[0];
    const backToTopBtn = document.getElementById('backToTopBtn');


    // -------------------------------------------------------------------
    // A. FEEDBACK DE SELEÇÃO DE ARQUIVOS
    // -------------------------------------------------------------------
    
    fileInput.addEventListener('change', function() {
        const count = this.files.length; 
        if (count === 0) {
            fileLabel.textContent = 'Selecionar Fotos e Vídeos';
        } else if (count === 1) {
            fileLabel.textContent = this.files[0].name;
        } else {
            fileLabel.textContent = count + ' arquivos selecionados';
        }
    });


    // -------------------------------------------------------------------
    // B. FUNÇÃO DE ENVIO DE ARQUIVOS (UPLOAD)
    // -------------------------------------------------------------------
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            uploadFeedback.textContent = 'Enviando... Por favor, aguarde.';
            uploadFeedback.style.color = 'orange';

            fetch(API_URL + '/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Falha no servidor. Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                uploadFeedback.textContent = 'Uploads concluídos com sucesso!';
                uploadFeedback.style.color = '#4CAF50';
                form.reset(); 

                // Reset do texto do botão de seleção
                fileLabel.textContent = 'Selecionar Fotos e Vídeos'; 
                
                // Faz a mensagem desaparecer após 5 segundos
                setTimeout(() => {
                    uploadFeedback.textContent = ''; 
                    uploadFeedback.style.color = 'initial'; 
                }, 5000); 

                // Reinicializa a galeria
                inicializarGaleria(); 
            })
            .catch(error => {
                console.error('Erro no upload:', error);
                uploadFeedback.textContent = 'Erro ao enviar as fotos. Verifique o console.';
                uploadFeedback.style.color = 'red';
            });
        });
    }


    // -------------------------------------------------------------------
    // C. FUNÇÕES DE CARREGAMENTO, PAGINAÇÃO E EXIBIÇÃO
    // -------------------------------------------------------------------
    
// Função utilitária para abrir o modal e carregar a mídia (ATUALIZADA)
function openModal(url, isVideo) {
    modal.style.display = "block";
    
    modalImg.style.display = 'none';
    modalVideo.style.display = 'none';
    modalVideo.pause(); 

    if (isVideo) {
        modalVideo.src = url;
        modalVideo.style.display = 'block';
        modalVideo.play();
    } else {
        modalImg.src = url;
        modalImg.style.display = 'block';
    }
    
    // --- NOVO: ATUALIZA O LINK DE DOWNLOAD ---
    downloadBtn.href = url;
    // O atributo 'download' faz o navegador salvar o arquivo com o nome original
    // Pegamos o nome do arquivo no final da URL
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    downloadBtn.setAttribute('download', fileName);
    // ------------------------------------------
}


    function inicializarGaleria() {
        galeria.innerHTML = 'Carregando galeria...';
        verMaisBtn.style.display = 'none';
        
        fetch(API_URL + '/api/galeria')
            .then(response => response.json())
            .then(arquivos => {
                allMedia = arquivos; // Salva a lista completa (nomes de arquivo)
                currentIndex = 0; // Reseta o índice
                galeria.innerHTML = ''; 
                currentMediaList = []; // Limpa a lista de URLs visíveis

                if (allMedia.length === 0) {
                     galeria.innerHTML = '<p>Seja o primeiro a enviar uma foto!</p>';
                     return;
                }
                
                exibirProximosItens();
            })
            .catch(error => {
                console.error('Erro ao carregar galeria:', error);
                galeria.innerHTML = 'Falha ao carregar as fotos da galeria.';
            });
    }

    function exibirProximosItens() {
        const endIndex = currentIndex + ITEMS_PER_PAGE;
        const itemsToShow = allMedia.slice(currentIndex, endIndex);
        
        itemsToShow.forEach(nomeArquivo => {
            let elemento;
            const url = API_URL + '/uploads/' + nomeArquivo; 
            
            const isImage = nomeArquivo.match(/\.(jpe?g|png|gif|webp)$/i);
            const isVideo = nomeArquivo.match(/\.(mp4|mov)$/i);

            if (isImage) {
                elemento = document.createElement('img');
                elemento.src = url;
                elemento.alt = "Foto de Convidado";
            } else if (isVideo) {
                elemento = document.createElement('video');
                elemento.src = url;
                elemento.controls = true;
            }
            
            if (elemento) {
                galeria.appendChild(elemento);
                currentMediaList.push(url); // Adiciona a URL na lista do carrossel
                
                // Adiciona o evento de clique para abrir o modal
                elemento.onclick = function() {
                    // Encontra o índice da mídia clicada
                    currentMediaIndex = currentMediaList.indexOf(this.src);

                    // Abre o modal
                    openModal(this.src, isVideo);
                }
            }
        });

        currentIndex = endIndex; // Atualiza o índice
        
        // Controla a visibilidade do botão "Ver Mais"
        if (currentIndex < allMedia.length) {
            verMaisBtn.style.display = 'block';
        } else {
            verMaisBtn.style.display = 'none';
        }
    }
    
    // Inicia a galeria na primeira carga da página
    inicializarGaleria();

    // Listener do botão "Ver Mais Fotos"
    verMaisBtn.addEventListener('click', exibirProximosItens);


    // -------------------------------------------------------------------
    // D. LÓGICA DO CARROSSEL (NAVEGAÇÃO)
    // -------------------------------------------------------------------
    
    function navigateCarousel(direction) {
        let newIndex = currentMediaIndex + direction;

        // Trata o looping (vai do último para o primeiro ou vice-versa)
        if (newIndex < 0) {
            newIndex = currentMediaList.length - 1;
        } else if (newIndex >= currentMediaList.length) {
            newIndex = 0;
        }
        
        currentMediaIndex = newIndex;
        
        const nextMediaUrl = currentMediaList[currentMediaIndex];
        const isVideo = nextMediaUrl.match(/\.(mp4|mov)$/i);
        
        openModal(nextMediaUrl, isVideo);
    }

    prevBtn.addEventListener('click', () => navigateCarousel(-1));
    nextBtn.addEventListener('click', () => navigateCarousel(1));

    // -------------------------------------------------------------------
    // E. LÓGICA DO FECHAMENTO DO MODAL
    // -------------------------------------------------------------------

    // Lógica de fechamento ao clicar no X
    closeModalBtn.onclick = function() {
        modal.style.display = "none";
        modalVideo.pause(); 
    }

    // Fechar se o usuário clicar fora do conteúdo
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            modalVideo.pause();
        }
    }
    
    // -------------------------------------------------------------------
    // F. LÓGICA DO BOTÃO VOLTAR AO TOPO
    // -------------------------------------------------------------------

    // 1. Mostrar/Esconder o botão na rolagem
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    // 2. Comportamento ao Clicar
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});