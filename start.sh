#!/bin/bash

# Python在线编译器启动脚本

# 确保脚本在python_compiler目录中运行
cd "$(dirname "$0")"

# 检查SSL证书是否存在
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "SSL证书不存在，正在生成自签名证书..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -nodes -out ssl/cert.pem -keyout ssl/key.pem -days 365 \
        -subj "/C=CN/ST=State/L=City/O=Organization/OU=Unit/CN=InCode.py.com" \
        -addext "subjectAltName = DNS:InCode.py.com,DNS:www.InCode.py.com,DNS:api.InCode.py.com,DNS:compiler.InCode.py.com,IP:192.168.1.6"
    
    if [ $? -ne 0 ]; then
        echo "生成SSL证书失败，请检查openssl是否正确安装"
        exit 1
    fi
    
    echo "SSL证书生成成功"
fi

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "虚拟环境不存在，正在创建..."
    python3 -m venv venv
    
    if [ $? -ne 0 ]; then
        echo "创建虚拟环境失败，请确保python3-venv已安装"
        echo "可以使用以下命令安装：sudo apt-get install python3-venv"
        exit 1
    fi
    
    echo "虚拟环境创建成功"
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "正在检查并安装依赖..."
pip install flask

# 启动应用
echo "正在启动Python在线编译器..."
echo "应用将在 https://localhost 上运行"
echo "按 Ctrl+C 停止服务器"

# 使用sudo运行，因为443是特权端口
# 如果不想使用sudo，可以修改app.py中的端口为非特权端口（如8443）
if [ "$EUID" -ne 0 ]; then
    echo "注意：访问443端口需要管理员权限"
    echo "您可以使用以下命令以管理员身份运行："
    echo "sudo $0"
    echo "或者修改app.py中的端口为非特权端口（如8443）"
    
    # 修改为使用非特权端口
    sed -i 's/port=443/port=8443/g' app.py
    echo "已将端口修改为8443，应用将在 https://localhost:8443 上运行"
fi

# 启动应用
python app.py