// Node.js Web服务器 - 提供文件存储API
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const PORT = 8888;
let STORAGE_DIR = path.join(__dirname, 'data');
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
};

function loadStorageDir() {
    const configPath = path.join(__dirname, 'storage_config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.storageDir && fs.existsSync(config.storageDir)) {
                STORAGE_DIR = config.storageDir;
            }
        } catch (error) {
            console.error('读取存储目录配置错误：', error);
        }
    }
}

function ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
        try {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
            console.log('创建数据目录：' + STORAGE_DIR);
        } catch (error) {
            console.error('创建数据目录失败：', error);
        }
    }
}

loadStorageDir();
ensureStorageDir();

function getFilePath(key) {
    return path.join(STORAGE_DIR, key + '.json');
}

function readJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('读取文件错误：', error);
        return null;
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入文件错误：', error);
        return false;
    }
}

function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return true;
    } catch (error) {
        console.error('删除文件错误：', error);
        return false;
    }
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;
    
    if (method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        return;
    }
    
    if (pathname === '/api/storage' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { key, value } = JSON.parse(body);
                const filePath = getFilePath(key);
                const success = writeJSON(filePath, value);
                
                res.writeHead(success ? 200 : 500, CORS_HEADERS);
                res.end(JSON.stringify({ success: success }));
            } catch (error) {
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (pathname === '/api/storage' && method === 'GET') {
        const key = parsedUrl.query.key;
        if (!key) {
            res.writeHead(400, CORS_HEADERS);
            res.end(JSON.stringify({ success: false, error: '缺少key参数' }));
            return;
        }
        
        const filePath = getFilePath(key);
        const data = readJSON(filePath);
        
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ success: true, data: data }));
    } else if (pathname === '/api/storage' && method === 'DELETE') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { key } = JSON.parse(body);
                const filePath = getFilePath(key);
                const success = deleteFile(filePath);
                
                res.writeHead(200, CORS_HEADERS);
                res.end(JSON.stringify({ success: success }));
            } catch (error) {
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (pathname === '/api/list' && method === 'GET') {
        try {
            const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
            const keys = files.map(f => f.replace('.json', ''));
            
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ success: true, data: keys }));
        } catch (error) {
            res.writeHead(500, CORS_HEADERS);
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    } else if (pathname === '/api/config' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                const filePath = getFilePath('system_config');
                const success = writeJSON(filePath, config);
                
                res.writeHead(success ? 200 : 500, CORS_HEADERS);
                res.end(JSON.stringify({ success: success }));
            } catch (error) {
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (pathname === '/api/config' && method === 'GET') {
        const filePath = getFilePath('system_config');
        const data = readJSON(filePath);
        
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ success: true, data: data }));
    } else if (pathname === '/api/storage-dir' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { dir } = JSON.parse(body);
                
                // 创建目录（如果不存在）
                if (!fs.existsSync(dir)) {
                    try {
                        fs.mkdirSync(dir, { recursive: true });
                    } catch (error) {
                        res.writeHead(500, CORS_HEADERS);
                        res.end(JSON.stringify({ success: false, error: '无法创建目录：' + error.message }));
                        return;
                    }
                }
                
                try {
                    const testFile = path.join(dir, '.write_test');
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                } catch (error) {
                    res.writeHead(500, CORS_HEADERS);
                    res.end(JSON.stringify({ success: false, error: '目录没有写入权限' }));
                    return;
                }
                
                const configPath = path.join(__dirname, 'storage_config.json');
                fs.writeFileSync(configPath, JSON.stringify({ storageDir: dir }, null, 2));
                
                STORAGE_DIR = dir;
                console.log('存储目录已更新：' + STORAGE_DIR);
                
                res.writeHead(200, CORS_HEADERS);
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (pathname === '/api/storage-dir' && method === 'GET') {
        const configPath = path.join(__dirname, 'storage_config.json');
        let dir = STORAGE_DIR;
        
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                dir = config.storageDir || STORAGE_DIR;
            } catch (error) {
                console.error('读取配置错误：', error);
            }
        }
        
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ success: true, data: dir }));
    } else if (pathname === '/api/print' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { type, content, filename } = JSON.parse(body);
                
                if (!content) {
                    res.writeHead(400, CORS_HEADERS);
                    res.end(JSON.stringify({ success: false, error: '打印内容不能为空' }));
                    return;
                }
                
                const now = new Date();
                const padZero = (num) => (num < 10 ? '0' : '') + num;
                const dateStr = now.getFullYear() + 
                    padZero(now.getMonth() + 1) + 
                    padZero(now.getDate()) + '_' +
                    padZero(now.getHours()) + 
                    padZero(now.getMinutes()) + 
                    padZero(now.getSeconds());
                
                const fileExtension = type === 'receipt' ? 'txt' : 'txt';
                const safeFilename = (filename || dateStr).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
                const filePath = path.join(__dirname, safeFilename + '_' + dateStr + '.' + fileExtension);
                
                const contentWithBOM = '\ufeff' + content;
                
                fs.writeFileSync(filePath, contentWithBOM, 'utf8');
                console.log('打印文件已生成：' + filePath);
                
                const escapedPath = filePath.replace(/"/g, '""');
                const printCommand = `notepad /p "${escapedPath}"`;
                
                exec(printCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('打印错误：', error.message);
                        res.writeHead(200, CORS_HEADERS);
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: '文件已生成',
                            filePath: filePath,
                            warning: '自动打印失败，文件已保存，请手动打印或检查默认打印机设置'
                        }));
                    } else {
                        console.log('打印任务已发送');
                        res.writeHead(200, CORS_HEADERS);
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: '打印任务已发送',
                            filePath: filePath
                        }));
                    }
                });
            } catch (error) {
                console.error('打印处理错误：', error);
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (pathname.startsWith('/data/')) {
        const filePath = path.join(__dirname, pathname);
        
        if (!filePath.startsWith(STORAGE_DIR) && !pathname.startsWith('/data/')) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    } else if (pathname === '/' || pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
    } else if (pathname.endsWith('.html')) {
        const filePath = path.join(__dirname, pathname);
        
        const normalizedFilePath = path.normalize(filePath);
        const normalizedDir = path.normalize(__dirname);
        if (!normalizedFilePath.startsWith(normalizedDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Forbidden');
            return;
        }
        
        if (!fs.existsSync(normalizedFilePath)) {
            console.error('HTML文件未找到：', normalizedFilePath);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found: ' + pathname);
            return;
        }
        
        fs.readFile(normalizedFilePath, (err, data) => {
            if (err) {
                console.error('读取HTML文件错误：', err);
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
    } else if (pathname.endsWith('.js')) {
        const filePath = path.normalize(path.join(__dirname, pathname));
        const normalizedDir = path.normalize(__dirname);
        
        if (!filePath.startsWith(normalizedDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
                res.end(data);
            }
        });
    } else if (pathname.endsWith('.css')) {
        const filePath = path.normalize(path.join(__dirname, pathname));
        const normalizedDir = path.normalize(__dirname);
        
        if (!filePath.startsWith(normalizedDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// 启动服务器
server.listen(PORT, () => {
    console.log('=================================================================');
    console.log('服务器已启动！');
    console.log('地址：http://localhost:' + PORT);
    console.log('数据目录：' + STORAGE_DIR);
    console.log('=================================================================');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('端口 ' + PORT + ' 已被占用，请关闭其他程序或修改端口号');
    } else {
        console.error('服务器错误：', err);
    }
    process.exit(1);
});

