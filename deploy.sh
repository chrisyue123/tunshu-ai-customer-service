#!/bin/bash
set -e

echo "===== 开始部署囤鼠迷你仓 AI 客服系统 ====="

# 1. 安装 Node.js 24
echo "[1/10] 安装 Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

# 2. 安装 pnpm
echo "[2/10] 安装 pnpm..."
sudo npm install -g pnpm
pnpm -v

# 3. 安装 pm2
echo "[3/10] 安装 pm2..."
sudo npm install -g pm2
pm2 -v

# 4. 安装 certbot（SSL 证书）
echo "[4/10] 安装 certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# 5. 克隆代码（替换成你的 GitHub 仓库地址）
echo "[5/10] 克隆代码..."
cd /home
sudo git clone https://github.com/你的用户名/tunshu-ai-customer-service.git
cd tunshu-ai-customer-service
sudo chown -R $USER:$USER .

# 6. 安装依赖
echo "[6/10] 安装依赖..."
pnpm install

# 7. 创建环境变量文件
echo "[7/10] 创建环境变量..."
cat > .env.local << 'EOF'
# 企业微信配置
WECOM_CORP_ID=ww2de6cb90788bb133
WECOM_AGENT_ID=1000007
WECOM_SECRET=HNLSpW89NyL9mu16m-EQHd2-B0_VgW_ibSrD1lNXfHY
WECOM_KF_ACCOUNT_ID=kfc4a507c5306096627
WECOM_TOKEN=
WECOM_ENCODING_AES_KEY=

# 系统配置
NEXT_PUBLIC_APP_URL=https://tunshu-ministorage.cn
EOF

# 8. 构建
echo "[8/10] 构建项目..."
pnpm build

# 9. 启动服务
echo "[9/10] 启动服务..."
pm2 start npm --name "tunshu-ai" -- start
pm2 save
pm2 startup

# 10. 配置 Nginx + SSL
echo "[10/10] 配置 Nginx 和 SSL..."

# 先配置 HTTP
sudo tee /etc/nginx/sites-enabled/default << 'NGINX'
server {
    listen 80 default_server;
    server_name tunshu-ministorage.cn www.tunshu-ministorage.cn;
    
    location = /WW_verify_edTtHtgecsNOnqFa.txt {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo systemctl restart nginx

# 获取 SSL 证书
echo "正在获取 SSL 证书..."
sudo certbot --nginx -d tunshu-ministorage.cn -d www.tunshu-ministorage.cn --non-interactive --agree-tos --email admin@tunshu-ministorage.cn

echo ""
echo "===== 部署完成！====="
echo "访问地址：https://tunshu-ministorage.cn"
echo ""
echo "查看服务状态：pm2 status"
echo "查看日志：pm2 logs tunshu-ai"
echo ""
echo "下一步："
echo "1. 在企业微信配置回调 URL：https://tunshu-ministorage.cn/api/wecom"
echo "2. 配置可信 IP：14.103.65.76"
echo "3. 关联微信客服应用"
