-- Recuperação de senha: 5 primeiros dígitos do CPF (hash) + data de nascimento
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS cpf_prefix_hash TEXT;
ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS birth_date DATE;
