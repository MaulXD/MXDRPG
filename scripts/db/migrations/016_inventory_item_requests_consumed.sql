-- Status "consumed" para o jogador dispensar notificações de aprovação/recusa
ALTER TABLE eldarin_inventory_item_requests
  DROP CONSTRAINT IF EXISTS eldarin_inventory_item_requests_status_check;

ALTER TABLE eldarin_inventory_item_requests
  ADD CONSTRAINT eldarin_inventory_item_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'consumed'));
