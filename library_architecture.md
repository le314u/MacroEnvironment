# Arquitetura da Biblioteca JS de Gerenciamento de Ambientes Virtuais

## 1. Visão Geral

A biblioteca permitirá a criação e gerenciamento de múltiplos "ambientes virtuais". Cada ambiente pode ter um conjunto único de hotkeys associadas. A troca entre ambientes pode ocorrer através da digitação de uma "tag" específica (texto) dentro de um determinado tempo. Uma notificação (toast) será exibida ao mudar de ambiente.

## 2. Estrutura da Classe Principal

A biblioteca será encapsulada em uma classe principal, por exemplo, `VirtualEnvManager`.

```javascript
class VirtualEnvManager {
    constructor(BUFFER_TIMEOUT_MS = 10000) {
        this.environments = {}; // Objeto para armazenar os ambientes { envName: { tag: '...', hotkeys: [], isActive: false } }
        this.activeEnvironment = null; // Nome do ambiente ativo
        this.textBuffer = '';
        this.bufferTimeout = null;
        this.BUFFER_TIMEOUT_MS = BUFFER_TIMEOUT_MS; // 10 segundos
        this.activeSubBuffers = []; // Para a lógica de sub-buffers

        this._initEventListeners();
    }

    // Métodos públicos e privados
}
```

## 3. Gerenciamento de Ambientes

### 3.1. Estrutura de Dados de um Ambiente

Cada ambiente será um objeto com as seguintes propriedades:

*   `name`: (String) Nome único do ambiente (usado para referenciar internamente, ex: ao adicionar hotkeys).
*   `tag`: (String) Texto (case-sensitive) que, quando digitado, ativa este ambiente.
*   `hotkeys`: (Array) Lista de objetos de hotkey associados a este ambiente.
*   `isActive`: (Boolean) Indica se o ambiente está atualmente ativo.

Exemplo no `this.environments`:
```javascript
{
    "work": {
        tag: "workMode",
        hotkeys: [/* ...objetos de hotkey... */],
        isActive: false
    },
    "gaming": {
        tag: "gameOn",
        hotkeys: [/* ... */],
        isActive: true // Exemplo de ambiente ativo
    }
}
```

### 3.2. Métodos para Ambientes

*   `createEnvironment(name, tag)`: Cria um novo ambiente. `name` deve ser único. `tag` deve ser única.
    *   Adiciona ao `this.environments`.
    *   Retorna sucesso/falha.
*   `setActiveEnvironmentByTag(tag)`: (Interno, chamado pelo buffer) Ativa um ambiente baseado na tag.
    *   Desativa o ambiente ativo anterior.
    *   Define o novo ambiente como ativo.
    *   Dispara o toast de notificação.
*   `setActiveEnvironmentByName(name)`: (Pode ser público) Ativa um ambiente pelo nome.
    *   Similar ao `setActiveEnvironmentByTag`.
*   `getCurrentEnvironment()`: Retorna o nome ou objeto do ambiente ativo.

## 4. Gerenciamento de Hotkeys

### 4.1. Estrutura de Dados de uma Hotkey

Cada hotkey será um objeto com:

*   `keyCombination`: (String) A combinação de teclas (ex: "Ctrl+Shift+A", "Cmd+K", "F1").
*   `callback`: (Function) A função a ser executada quando a hotkey é pressionada.
*   `callbackArgs`: (Array) Argumentos a serem passados para o callback.

### 4.2. Métodos para Hotkeys

*   `addHotkeyToEnvironment(environmentName, keyCombination, callback, ...callbackArgs)`: Adiciona uma hotkey a um ambiente específico.
    *   Verifica se o ambiente `environmentName` existe.
    *   Adiciona o objeto hotkey ao array `hotkeys` do ambiente.

### 4.3. Lógica de Escuta e Disparo

*   Um event listener global para `keydown` será inicializado.
*   Quando uma tecla é pressionada, a biblioteca verifica se a combinação corresponde a alguma hotkey do `this.activeEnvironment`.
*   Se houver correspondência, o `callback` associado é executado com `callbackArgs`.
*   A biblioteca precisará de uma função auxiliar para normalizar e comparar combinações de teclas (ex: lidar com `Control` vs `Ctrl`, ordem das teclas modificadoras).

## 5. Buffer de Texto para Troca de Ambiente

### 5.1. Captura de Digitação

*   O event listener global `keydown` também capturará teclas alfanuméricas e outros caracteres relevantes para formar a `tag`.
*   Ignorar teclas modificadoras quando o foco não está em um input/textarea (para não interferir com hotkeys).

### 5.2. Lógica de Sub-buffers e Temporizador

*   Quando o usuário começa a digitar, cada substring crescente da digitação forma um "sub-buffer" potencial.
    *   Ex: Usuário digita "t", "e", "s", "t", "a".
    *   Buffers: "t", "te", "tes", "test", "testa".
*   Cada sub-buffer tem seu próprio temporizador de 10 segundos (ou um temporizador global é reiniciado/verificado).
*   Se um sub-buffer corresponde a uma `tag` de ambiente, a troca ocorre.
*   Se o temporizador de um sub-buffer expira sem match, ele é descartado.
*   A implementação precisa ser eficiente para gerenciar múltiplos sub-buffers e seus timers.
    *   Uma abordagem mais simples: um único `this.textBuffer` que acumula a digitação. A cada nova tecla:
        1.  Reinicia `this.bufferTimeout` para 10 segundos.
        2.  Acrescenta a tecla ao `this.textBuffer`.
        3.  Verifica se `this.textBuffer` corresponde a alguma `tag`.
        4.  Se corresponder, troca o ambiente e limpa `this.textBuffer` e `this.bufferTimeout`.
        5.  Se o timeout ocorrer, limpa `this.textBuffer`.
    *   A descrição do usuário "cria vários buffers que se alto destroem" sugere uma lógica mais complexa. Poderia ser implementado mantendo uma lista de strings ativas (substrings da digitação recente) e seus timestamps de criação. Um loop de verificação periódico (ou no keydown) removeria os expirados e checaria por matches.

### 5.3. Matching

*   Case-sensitive, conforme solicitado.

## 6. Notificação Toast

*   Uma função interna `_showToast(message)`.
*   Cria um elemento DOM simples para o toast (ex: um `div` com estilos básicos).
*   Posicionamento padrão (ex: canto superior direito).
*   Animação simples de entrada/saída.
*   Autodestruição após alguns segundos.
*   Chamada com a mensagem "Ambiente 'X' ativado." após a troca bem-sucedida.

## 7. APIs Públicas (Exemplos)

```javascript
const envManager = new VirtualEnvManager();

envManager.createEnvironment("desenvolvimento", "dev");
envManager.createEnvironment("documentacao", "docs");

envManager.addHotkeyToEnvironment("desenvolvimento", "Ctrl+S", () => {
    console.log("Salvando no ambiente de desenvolvimento...");
});

envManager.addHotkeyToEnvironment("documentacao", "Ctrl+P", (param1) => {
    console.log("Imprimindo docs: " + param1);
}, "Guia Rápido");

// O usuário digita "dev" -> toast "Ambiente 'desenvolvimento' ativado."
// Pressiona Ctrl+S -> o callback é chamado.
```

## 8. Considerações Adicionais

*   **Prevenção de Conflitos:** Como lidar se uma hotkey global do navegador/SO for a mesma que uma hotkey da biblioteca.
*   **Foco em Inputs:** Desabilitar a captura do buffer de texto e hotkeys quando o usuário está digitando em campos de input ou textareas, a menos que seja um comportamento desejado.
*   **Parsing de Hotkeys:** Uma função robusta para parsear strings como "Ctrl+Shift+A" em um formato interno consistente.
*   **Performance:** Especialmente na lógica de sub-buffers e event listeners globais.
