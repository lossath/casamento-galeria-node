// ===================================================================
// CONFIGURAÇÕES GLOBAIS
// ===================================================================

const API_URL = 'https://galeria-casamento-gratis.onrender.com';
const ITEMS_PER_PAGE = 20;               

let allMedia = [];       
let currentIndex = 0;    
let currentMediaList = []; // Lista de TODAS as URLs carregadas na galeria
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
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Elementos de Upload
    const fileInput = document.getElementById('file-upload');
    const fileLabel = document.getElementById('file-label');

    // Elementos do Modal (Lightbox)
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const modalVideo = document.getElementById('video01');
    const closeModalBtn = document.getElementsByClassName('close-btn')[0];
    const prevBtn = document.getElementsByClassName('prev-btn')[0];
    const nextBtn = document.getElementsByClassName('next-btn')[0];
    const backToTopBtn = document.getElementById('backToTopBtn');


    // -------------------------------------------------------------------
    // FUNÇÕES DE UTILIDADE
    // -------------------------------------------------------------------
    
    // Função para abrir o modal e carregar a mídia
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

        // Atualiza o botão de download
        downloadBtn.href = url;
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        downloadBtn.setAttribute('download', fileName);
    }
    
    // Função de navegação do carrossel
    function navigateCarousel(direction) {
        let newIndex = currentMediaIndex + direction;

        // Trata o looping
        if (newIndex < 0) {
            newIndex = currentMediaList.length - 1;
        } else if (newIndex >= currentMediaList.length) {
            newIndex = 0;
        }
        
        currentMediaIndex = newIndex;
        
        const nextMediaUrl = currentMediaList[currentMediaIndex];
        const isVideo = nextMediaUrl.includes('/video/upload/');
        
        openModal(nextMediaUrl, isVideo);
    }

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

                fileLabel.textContent = 'Selecionar Fotos e Vídeos'; 
                
                // Faz a mensagem de feedback desaparecer após 5 segundos
                setTimeout(() => {
                    uploadFeedback.textContent = ''; 
                    uploadFeedback.style.color = 'initial'; 
                }, 5000); 

                // --- AÇÃO CRÍTICA: Pausa de 1,5 segundos (1500ms) para o Cloudinary ---
                setTimeout(() => {
                    inicializarGaleria(); 
                }, 1500); 
            })
            .catch(error => {
                console.error('Erro no upload:', error);
                uploadFeedback.textContent = 'Erro ao enviar as fotos. Verifique o console.';
                uploadFeedback.style.color = 'red';
            });
        });
    }


    // -------------------------------------------------------------------
    // C. FUNÇÕES DE CARREGAMENTO E PAGINAÇÃO
    // -------------------------------------------------------------------
    
    function inicializarGaleria() {
        galeria.innerHTML = 'Carregando galeria...';
        verMaisBtn.style.display = 'none';
        
        fetch(API_URL + '/api/galeria')
            .then(response => response.json())
            .then(urls => {
                allMedia = urls; // Recebe a lista de URLs completas do Cloudinary
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
        
        itemsToShow.forEach(url => { // 'url' é o link completo do Cloudinary
            let elemento;
            
            const isImage = url.includes('/image/upload/');
            const isVideo = url.includes('/video/upload/');

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
                    currentMediaIndex = currentMediaList.indexOf(this.src);
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
    // D. LÓGICA DO CARROSSEL E MODAL
    // -------------------------------------------------------------------

    prevBtn.addEventListener('click', () => navigateCarousel(-1));
    nextBtn.addEventListener('click', () => navigateCarousel(1));

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
    // E. LÓGICA DO BOTÃO VOLTAR AO TOPO
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