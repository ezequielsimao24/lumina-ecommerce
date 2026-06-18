# TODO - Correção do modal de checkout

- [x] Entender causa: botão `#openCheckoutBtn` não abre `#checkoutModal` (JS não tem handler).
- [x] Atualizar `js/script.js`:
  - [x] Capturar `openCheckoutBtn`, `checkoutModal`, `checkoutModalClose`.
  - [x] Implementar `toggleCheckoutModal(open)`.
  - [x] Ligar clique do botão `#openCheckoutBtn` para abrir o modal.
  - [x] Ligar fechamento via botão `checkout-modal-close` e via `Escape`.
  - [x] Fechar/compatibilizar o drawer do carrinho ao abrir o modal.
- [x] Atualizar `css/style.css`:
  - [x] Criar estilos para `#checkoutModal` no estado aberto (mostrar/ocultar).
- [ ] Testar manualmente:
  - [ ] Abrir carrinho e clicar “Finalizar Pedido” abre o modal.
  - [ ] Fechar modal volta ao carrinho.
  - [ ] Submeter checkout abre o WhatsApp.


