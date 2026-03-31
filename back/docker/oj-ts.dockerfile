# 用于OJ评测的TypeScript沙箱镜像
FROM node:20-slim

RUN npm install -g typescript ts-node
RUN useradd -m sandboxuser
USER sandboxuser
WORKDIR /sandbox

# 只暴露/sandbox目录用于代码挂载
