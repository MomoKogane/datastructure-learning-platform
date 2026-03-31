# OJ 沙箱镜像说明

本目录包含OJ评测用的Docker沙箱镜像：
- oj-cpp.dockerfile：C++评测环境（gcc）
- oj-python.dockerfile：Python评测环境
- oj-java.dockerfile：Java评测环境

## 构建镜像

在back目录下执行：

```bash
bash docker/build-all.sh
```

分别生成：
- dslp-oj-cpp
- dslp-oj-python
- dslp-oj-java

## 用法示例

以C++为例：

```bash
docker run --rm -v /your/tmpdir:/sandbox dslp-oj-cpp g++ main.cpp -o main
```

```bash
docker run --rm -v /your/tmpdir:/sandbox dslp-oj-cpp ./main < input.txt
```

所有评测均在 /sandbox 目录下进行，挂载本地临时目录。

## 安全说明
- 仅允许非root用户执行
- 仅挂载/sandbox，避免主机泄露
- 可结合--memory、--cpus等docker参数进一步限制资源
