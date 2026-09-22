from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import requests


HOST = "0.0.0.0"
PORTA = 5000


# ==========================================
# SUPABASE
# ==========================================

SUPABASE_URL = "https://fgvdsukildytjrehpjul.supabase.co"

SUPABASE_KEY = "sb_publishable_U_EPZpUuoQ38rRozL61J_w_XazrXubS"

TABELA = "leituras_sensores"


# ==========================================
# FUNÇÃO PARA ENVIAR AO SUPABASE
# ==========================================

def enviar_supabase(dados):

    url = f"{SUPABASE_URL}/rest/v1/{TABELA}"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    try:

        print()
        print("Enviando dados para o Supabase...")

        resposta = requests.post(
            url,
            headers=headers,
            json=dados,
            timeout=15
        )

        print("Status Supabase:", resposta.status_code)

        if resposta.status_code in (200, 201):

            print("======================================")
            print(" SUPABASE: DADOS SALVOS COM SUCESSO")
            print("======================================")

            return True

        else:

            print("======================================")
            print(" ERRO NO SUPABASE")
            print("======================================")

            print("Status:", resposta.status_code)
            print("Resposta:", resposta.text)

            return False

    except Exception as erro:

        print()
        print("======================================")
        print(" ERRO DE CONEXAO COM SUPABASE")
        print("======================================")
        print(repr(erro))

        return False


# ==========================================
# SERVIDOR DO ESP8266
# ==========================================

class ServidorESP(BaseHTTPRequestHandler):

    def do_POST(self):

        # ==================================
        # ROTA DOS DADOS
        # ==================================

        if self.path != "/dados":

            self.send_response(404)
            self.end_headers()

            self.wfile.write(
                b"Rota nao encontrada"
            )

            return

        try:

            # ==================================
            # RECEBE JSON
            # ==================================

            tamanho = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            corpo = self.rfile.read(tamanho)

            texto = corpo.decode("utf-8")

            dados = json.loads(texto)


            # ==================================
            # MOSTRA OS DADOS
            # ==================================

            print()
            print("======================================")
            print(" DADOS RECEBIDOS DO ESP8266")
            print("======================================")

            print(
                "Temperatura Zona 1:",
                dados.get("temp_zona1")
            )

            print(
                "Umidade Zona 1:",
                dados.get("umidade_zona1")
            )

            print(
                "Temperatura Zona 2:",
                dados.get("temp_zona2")
            )

            print(
                "Umidade Zona 2:",
                dados.get("umidade_zona2")
            )

            print(
                "Fumaça Zona 1:",
                dados.get("fumaca_zona1")
            )

            print(
                "Fumaça Zona 2:",
                dados.get("fumaca_zona2")
            )

            print()
            print("JSON recebido:")
            print(json.dumps(
                dados,
                indent=2,
                ensure_ascii=False
            ))

            print("======================================")


            # ==================================
            # ENVIA PARA O SUPABASE
            # ==================================

            sucesso = enviar_supabase(dados)


            # ==================================
            # RESPONDE AO ESP8266
            # ==================================

            if sucesso:

                resposta = {
                    "status": "ok",
                    "mensagem": "Dados salvos no Supabase"
                }

                codigo = 200

            else:

                resposta = {
                    "status": "erro",
                    "mensagem": "Falha ao salvar no Supabase"
                }

                codigo = 500


            resposta_json = json.dumps(
                resposta
            ).encode("utf-8")


            self.send_response(codigo)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(resposta_json))
            )

            self.end_headers()

            self.wfile.write(
                resposta_json
            )


        except Exception as erro:

            print()
            print("======================================")
            print(" ERRO AO PROCESSAR DADOS")
            print("======================================")
            print(repr(erro))


            self.send_response(500)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.end_headers()

            self.wfile.write(
                b'{"status":"erro"}'
            )


# ==========================================
# INICIA SERVIDOR
# ==========================================

print()
print("======================================")
print(" ECOGUARD - SERVIDOR DO ESP8266")
print("======================================")
print()
print("IP do computador: 192.168.0.119")
print("Porta:", PORTA)
print()
print("Destino:")
print(SUPABASE_URL)
print()
print("Tabela:")
print(TABELA)
print()
print("Aguardando ESP8266...")
print()


servidor = HTTPServer(
    (HOST, PORTA),
    ServidorESP
)


try:

    servidor.serve_forever()

except KeyboardInterrupt:

    print()
    print("Servidor encerrado.")

finally:

    servidor.server_close()