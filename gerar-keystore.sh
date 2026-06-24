#!/bin/bash
# ================================================================
# FENDA MUSIC - Gerador de Keystore para assinar APK
# Execute este script no Termux UMA ÚNICA VEZ
# Guarde o arquivo .jks e as senhas em local seguro!
# ================================================================

echo "======================================="
echo "  Fenda Music - Gerador de Keystore"
echo "======================================="
echo ""

# Verificar se keytool está disponível
if ! command -v keytool &> /dev/null; then
    echo "Instalando Java no Termux..."
    pkg install openjdk-17 -y
fi

# Definir variáveis
KEYSTORE_NAME="fenda-release-key.jks"
KEY_ALIAS="fenda-music"

echo "Vamos criar sua keystore para assinar o APK."
echo "Guarde as senhas que você digitar — sem elas não é possível atualizar o app na Play Store!"
echo ""

# Solicitar senhas
read -sp "Digite a senha da KEYSTORE (mín. 6 caracteres): " STORE_PASS
echo ""
read -sp "Confirme a senha da KEYSTORE: " STORE_PASS2
echo ""

if [ "$STORE_PASS" != "$STORE_PASS2" ]; then
    echo "❌ Senhas não coincidem. Tente novamente."
    exit 1
fi

read -sp "Digite a senha da CHAVE (pode ser a mesma): " KEY_PASS
echo ""

# Gerar keystore
echo ""
echo "Gerando keystore..."

keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_NAME" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias "$KEY_ALIAS" \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=Fenda Music, OU=App, O=Fenda Music, L=Brasil, S=Brasil, C=BR"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore gerada com sucesso: $KEYSTORE_NAME"
    echo ""
    
    # Converter para Base64 para usar no GitHub Actions
    BASE64=$(base64 -w 0 "$KEYSTORE_NAME")
    
    echo "======================================="
    echo "AGORA ADICIONE ESTES SECRETS NO GITHUB:"
    echo "GitHub → Settings → Secrets → Actions"
    echo "======================================="
    echo ""
    echo "KEYSTORE_BASE64:"
    echo "$BASE64"
    echo ""
    echo "KEYSTORE_PASSWORD: $STORE_PASS"
    echo ""
    echo "KEY_ALIAS: $KEY_ALIAS"
    echo ""
    echo "KEY_PASSWORD: $KEY_PASS"
    echo ""
    echo "======================================="
    echo "⚠️  IMPORTANTE: Guarde estas informações!"
    echo "Sem elas você não consegue atualizar o app."
    echo "======================================="
    
    # Salvar em arquivo local (só para referência)
    cat > fenda-keystore-info.txt << EOF
KEYSTORE_FILE: $KEYSTORE_NAME
KEY_ALIAS: $KEY_ALIAS
KEYSTORE_PASSWORD: (a que você digitou)
KEY_PASSWORD: (a que você digitou)

Gerado em: $(date)

ATENÇÃO: Não compartilhe este arquivo!
EOF
    echo ""
    echo "Informações salvas em: fenda-keystore-info.txt"
else
    echo "❌ Erro ao gerar keystore. Tente novamente."
    exit 1
fi
