# =====================================================================
# Dashboard Confitec - Imagem de produção (nginx servindo estáticos)
#
# A aplicação é 100% client-side (HTML + CSS + JS puro com ES Modules).
# Não há etapa de build — apenas copiamos os arquivos para o nginx.
# =====================================================================
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="Dashboard Confitec"
LABEL org.opencontainers.image.description="Plataforma de BI para análise de holerites em PDF"
LABEL org.opencontainers.image.source="https://github.com/Confitec-Sustentacao/dashboard-confitec"

# Remove conteúdo default do nginx
RUN rm -rf /usr/share/nginx/html/*

# Substitui o default.conf com configurações otimizadas para ES Modules + gzip + cache
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os arquivos da aplicação (sem README, docs, imgs, .git etc)
COPY index.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# Healthcheck: garante que o nginx está respondendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80
