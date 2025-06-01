# Python在线编译器 - DNS和SSL配置指南

本指南将帮助您为Python在线编译器配置DNS服务和SSL加密。

## SSL配置

### 开发环境（自签名证书）
当前配置使用自签名证书，适用于开发和测试环境：

```bash
# 生成自签名证书
cd /opt/python_compiler
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -nodes -out ssl/cert.pem -keyout ssl/key.pem -days 365 \
    -subj "/C=CN/ST=State/L=City/O=Organization/OU=Unit/CN=your-domain.com"
```

### 生产环境（Let's Encrypt）
对于生产环境，建议使用Let's Encrypt获取免费的SSL证书：

1. 安装Certbot：
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. 获取证书：
```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

3. 更新app.py中的SSL配置：
```python
ssl_context = ('/etc/letsencrypt/live/your-domain.com/fullchain.pem', 
               '/etc/letsencrypt/live/your-domain.com/privkey.pem')
```

4. 设置自动续期：
```bash
sudo certbot renew --dry-run
```

## DNS配置

### 基本DNS记录
在您的DNS服务提供商（如Cloudflare、Route53等）控制面板中添加以下记录：

1. A记录：
   - 主机名：@ 或 your-domain.com
   - 类型：A
   - 值：您服务器的IP地址
   - TTL：自动或3600

2. CNAME记录（如果需要www子域名）：
   - 主机名：www
   - 类型：CNAME
   - 值：your-domain.com
   - TTL：自动或3600

### DNS提供商设置
常见DNS提供商的配置步骤：

#### Cloudflare
1. 注册Cloudflare账户
2. 添加您的域名
3. 更新域名服务器为Cloudflare提供的服务器
4. 在DNS设置中添加必要的记录
5. 启用Cloudflare的SSL/TLS保护

#### Amazon Route53
1. 在AWS控制台创建托管区域
2. 添加必要的DNS记录
3. 更新域名注册商的名称服务器

## 安全性建议

1. SSL/TLS配置：
   - 使用强加密套件
   - 定期更新证书
   - 启用HSTS
   - 禁用不安全的TLS版本

2. DNS安全：
   - 启用DNSSEC（如果DNS提供商支持）
   - 使用强密码保护DNS管理账户
   - 定期审查DNS记录
   - 监控DNS更改

3. 服务器安全：
   - 保持系统更新
   - 配置防火墙
   - 使用安全的端口
   - 实施访问控制

## 故障排除

### SSL问题
1. 证书错误：
   - 检查证书路径是否正确
   - 验证证书是否过期
   - 确保证书链完整

2. 连接问题：
   - 检查防火墙设置
   - 验证443端口是否开放
   - 检查SSL配置语法

### DNS问题
1. DNS未解析：
   - 检查DNS记录配置
   - 验证域名服务器设置
   - 等待DNS传播（最多48小时）

2. 无法访问网站：
   - 检查A记录是否正确
   - 验证服务器IP地址
   - 检查服务器防火墙设置

## 监控和维护

1. 定期任务：
   - 监控证书过期时间
   - 检查DNS记录准确性
   - 更新SSL配置
   - 备份证书和配置

2. 日志监控：
   - 检查访问日志
   - 监控错误日志
   - 设置告警通知

## 支持

如果您遇到任何问题，请：
1. 检查错误日志
2. 查阅本文档的故障排除部分
3. 联系系统管理员或技术支持

## 注意事项

- 在更改DNS设置之前备份当前配置
- 在生产环境中使用受信任的SSL证书
- 定期更新和维护安全配置
- 保持证书私钥安全
- 监控SSL/DNS服务状态