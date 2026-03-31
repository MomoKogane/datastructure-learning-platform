# 用于OJ评测的Python沙箱镜像
FROM python:3.11-slim

RUN useradd -m sandboxuser
USER sandboxuser
WORKDIR /sandbox

# 只暴露/sandbox目录用于代码挂载
