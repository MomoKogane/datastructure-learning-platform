# 用于OJ评测的Java沙箱镜像
FROM openjdk:8-jdk-slim

RUN useradd -m sandboxuser
USER sandboxuser
WORKDIR /sandbox

# 只暴露/sandbox目录用于代码挂载
