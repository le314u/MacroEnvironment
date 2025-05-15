# Biblioteca JS de Gerenciamento de Ambientes Virtuais

Esta biblioteca permite criar e gerenciar múltiplos "ambientes virtuais" em uma página web. Cada ambiente pode ter um conjunto único de hotkeys (atalhos de teclado) associadas. A troca entre ambientes pode ocorrer através da digitação de uma "tag" específica (texto) dentro de um determinado tempo. Uma notificação (toast) será exibida ao mudar de ambiente.

## Funcionalidades Principais

*   **Criação de Ambientes:** Defina ambientes com um nome único e uma "tag" de ativação.
*   **Ativação por Tag:** Digite a tag associada a um ambiente para ativá-lo. A digitação é case-sensitive e possui um buffer com timeout.
*   **Hotkeys por Ambiente:** Associe combinações de teclas (hotkeys) e funções de callback a ambientes específicos. As hotkeys só funcionam quando o ambiente correspondente está ativo.
*   **Notificação Toast:** Uma mensagem toast é exibida na tela ao trocar de ambiente.

## Estrutura de Arquivos

```
/virtual-env-manager-lib
|-- /src
|   |-- VirtualEnvManager.js  // Classe principal da biblioteca
|   |-- HotkeyParser.js       // Utilitário para normalizar e processar hotkeys
|-- library_architecture.md   // Documento com a arquitetura detalhada da biblioteca
|-- README.md                 // Este arquivo
```

## Como Usar (Exemplo Básico)

1.  Inclua os arquivos JavaScript da biblioteca na sua página HTML:
    ```html
    <script src="path/to/src/HotkeyParser.js"></script>
    <script src="path/to/src/VirtualEnvManager.js"></script>
    ```

2.  No seu script principal, crie uma instância da `VirtualEnvManager`:
    ```javascript
    const envManager = new VirtualEnvManager();
    ```

3.  Crie os ambientes desejados:
    ```javascript
    envManager.createEnvironment("NomeDoAmbiente1", "tagDeAtivacao1");
    envManager.createEnvironment("NomeDoAmbiente2", "tagDeAtivacao2");
    ```

4.  Adicione hotkeys aos ambientes:
    ```javascript
    envManager.addHotkeyToEnvironment("NomeDoAmbiente1", "Ctrl+Shift+X", () => {
        console.log("Hotkey Ctrl+Shift+X disparada no Ambiente 1!");
    });

    envManager.addHotkeyToEnvironment("NomeDoAmbiente2", "Alt+Y", (param) => {
        console.log(`Hotkey Alt+Y disparada no Ambiente 2 com parâmetro: ${param}`);
    }, "meuParametro");
    ```

5.  Para trocar de ambiente, digite a "tagDeAtivacao1" ou "tagDeAtivacao2" (respeitando maiúsculas e minúsculas) fora de campos de input. Um toast aparecerá confirmando a troca.

Consulte o arquivo `examples/index.html` e `examples/main.js` para um exemplo funcional mais detalhado.
O arquivo `library_architecture.md` contém detalhes sobre a estrutura interna e decisões de design.

## Considerações

*   A captura de hotkeys e tags é desabilitada quando o foco está em campos de input (`<input>`, `<textarea>`) ou elementos com `contentEditable`.
*   O buffer de texto para ativação de tags tem um timeout de 10 segundos.
*   A funcionalidade de ToastNotifier.js ainda não está como um módulo separado completo, um fallback visual é usado dentro de `VirtualEnvManager.js`.

## Próximos Passos (Sugestões)

*   Implementar `ToastNotifier.js` como um módulo mais robusto e personalizável.
*   Adicionar mais opções de configuração (ex: tempo do buffer, aparência do toast).
*   Melhorar o gerenciamento de foco para casos de uso mais complexos.

