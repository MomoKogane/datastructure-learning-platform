# 用于OJ评测的C++沙箱镜像

# 基于gcc官方镜像，额外安装clang/clang++
FROM gcc:13.2.0

RUN apt-get update \
	&& apt-get install -y clang \
	&& rm -rf /var/lib/apt/lists/*

# 创建非root用户，提升安全性
RUN useradd -m sandboxuser
USER sandboxuser
WORKDIR /sandbox

# 只暴露/sandbox目录用于代码挂载
