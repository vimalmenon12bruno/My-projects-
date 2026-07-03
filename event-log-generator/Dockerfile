# Self-contained container image for the PROCESS//FORGE app.
# Uses the unprivileged nginx image (non-root, listens on 8080) so it runs
# under Kyma's restricted Pod Security Standard without extra config.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY ui/index.html /usr/share/nginx/html/index.html

EXPOSE 8080
