#!/bin/bash
# 构建所有OJ沙箱镜像
set -e
docker build -t dslp-oj-cpp -f docker/oj-cpp.dockerfile .
docker build -t dslp-oj-python -f docker/oj-python.dockerfile .
docker build -t dslp-oj-java -f docker/oj-java.dockerfile .
echo "All OJ sandbox images built successfully."
