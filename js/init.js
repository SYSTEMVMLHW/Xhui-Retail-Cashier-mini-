var InitWizard = {
    currentStep: 1,
    totalSteps: 3,
    config: {},
    
    init: function() {
        this.renderStep(1);
        this.bindEvents();
    },
    
    renderStep: function(step) {
        this.currentStep = step;
        
        var container = DOM.getElement('#init-content');
        if (!container) return;
        
        var html = '';
        
        switch(step) {
            case 1:
                html = this.renderStep1();
                break;
            case 2:
                html = this.renderStep2();
                break;
            case 3:
                html = this.renderStep3();
                break;
        }
        
        DOM.setHTML(container, html);
        this.updateProgress();
    },
    
    renderStep1: function() {
        var html = '<div class="init-step">';
        html += '<h2>步骤 1/3：配置数据存储</h2>';
        html += '<p class="text-muted mb-20">设置数据文件在服务器设备上的存储位置</p>';
        html += '<div class="form-group">';
        html += '<label class="form-label">数据存储目录</label>';
        html += '<input type="text" id="storage-dir" class="form-control" placeholder="例如：D:\\收银数据">';
        html += '<small class="text-muted mt-10" style="display:block;">提示：目录将在服务器运行设备上创建，用于存储所有业务数据</small>';
        html += '</div>';
        html += '<div class="alert alert-warning">';
        html += '<strong>⚠️ 注意：</strong>请确保指定的目录路径有效且服务器有写入权限';
        html += '</div>';
        html += '</div>';
        return html;
    },
    
    renderStep2: function() {
        var html = '<div class="init-step">';
        html += '<h2>步骤 2/3：创建管理员账号</h2>';
        html += '<p class="text-muted mb-20">设置用于登录和管理系统的管理员账号</p>';
        html += '<div class="form-group">';
        html += '<label class="form-label">用户名</label>';
        html += '<input type="text" id="admin-username" class="form-control" placeholder="请输入用户名" value="admin">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">密码</label>';
        html += '<input type="password" id="admin-password" class="form-control" placeholder="请输入密码（不少于6位）">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">确认密码</label>';
        html += '<input type="password" id="admin-password-confirm" class="form-control" placeholder="请再次输入密码">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">店铺名称</label>';
        html += '<input type="text" id="shop-name" class="form-control" placeholder="请输入店铺名称">';
        html += '</div>';
        html += '</div>';
        return html;
    },
    
    renderStep3: function() {
        var html = '<div class="init-step">';
        html += '<h2>步骤 3/3：选择业务模式</h2>';
        html += '<p class="text-muted mb-20">系统当前仅支持零售模式</p>';
        html += '<div class="mode-selector">';
        html += '<div class="mode-card selected" data-mode="retail">';
        html += '<div class="mode-icon">💰</div>';
        html += '<h3>零售模式</h3>';
        html += '<p>适用于商场、便利店、服装店等零售业态</p>';
        html += '<ul class="mode-features">';
        html += '<li>快速收银</li>';
        html += '<li>商品扫码</li>';
        html += '<li>即时结账</li>';
        html += '<li>收银小票</li>';
        html += '</ul>';
        html += '</div>';
        html += '</div>';
        html += '<div style="margin-top:30px;padding:20px;background:#FFF8E1;border:1px solid #FBBC04;border-radius:8px;">';
        html += '<p style="color:#F57F17;margin:0;"><strong>提示：</strong>餐饮模式正在开发中，敬请期待！</p>';
        html += '</div>';
        html += '</div>';
        
        this.config.businessMode = 'retail';
        
        return html;
    },
    
    updateProgress: function() {
        var progress = (this.currentStep / this.totalSteps) * 100;
        var progressBar = DOM.getElement('#init-progress');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    },
    
    bindEvents: function() {
        var self = this;
        
        DOM.addEventListener(document, 'click', function(e) {
            if (e.target && e.target.id === 'init-next') {
                self.nextStep();
            }
            
            if (e.target && e.target.id === 'init-prev') {
                self.prevStep();
            }
            
            if (e.target && e.target.closest('.mode-card')) {
                self.selectMode(e.target.closest('.mode-card'));
            }
        });
    },
    
    nextStep: function() {
        var valid = false;
        
        switch(this.currentStep) {
            case 1:
                valid = this.validateStep1();
                break;
            case 2:
                valid = this.validateStep2();
                break;
            case 3:
                valid = this.validateStep3();
                break;
        }
        
        if (valid) {
            if (this.currentStep < this.totalSteps) {
                this.renderStep(this.currentStep + 1);
            } else {
                this.completeInit();
            }
        }
    },
    
    prevStep: function() {
        if (this.currentStep > 1) {
            this.renderStep(this.currentStep - 1);
        }
    },
    
    validateStep1: function() {
        var storageDir = DOM.getElement('#storage-dir').value.trim();
        
        if (!storageDir) {
            Message.error('请输入数据存储目录');
            return false;
        }
        
        this.config.storageDir = storageDir;
        
        // 动态获取API URL（基于当前页面地址）
        var protocol = window.location.protocol;
        var hostname = window.location.hostname;
        var port = window.location.port || '8888';
        var apiUrl = protocol + '//' + hostname + ':' + port + '/api';
        
        this.config.url = apiUrl;
        Storage.setBaseURL(this.config.url);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.config.url + '/storage-dir', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ dir: storageDir }));
        
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.success) {
                Message.success('存储目录配置成功');
                return true;
            } else {
                Message.error('配置存储目录失败：' + (response.error || '未知错误'));
                return false;
            }
        } else {
            Message.error('无法连接到服务器，请确保服务器已启动（http://localhost:8888）');
            return false;
        }
    },
    
    validateStep2: function() {
        var username = DOM.getElement('#admin-username').value.trim();
        var password = DOM.getElement('#admin-password').value;
        var passwordConfirm = DOM.getElement('#admin-password-confirm').value;
        var shopName = DOM.getElement('#shop-name').value.trim();
        
        if (!username) {
            Message.error('请输入用户名');
            return false;
        }
        
        if (!password || password.length < 6) {
            Message.error('密码长度不能少于6位');
            return false;
        }
        
        if (password !== passwordConfirm) {
            Message.error('两次输入的密码不一致');
            return false;
        }
        
        if (!shopName) {
            Message.error('请输入店铺名称');
            return false;
        }
        
        this.config.username = username;
        this.config.password = Utils.md5(password);
        this.config.shopName = shopName;
        
        return true;
    },
    
    validateStep3: function() {
        if (!this.config.businessMode) {
            this.config.businessMode = 'retail';
        }
        
        if (this.config.businessMode === 'restaurant') {
            Message.warning('餐饮模式正在开发中，敬请期待！');
            Message.error('请选择零售模式继续');
            return false;
        }
        
        return true;
    },
    
    selectMode: function(card) {
        var mode = card.getAttribute('data-mode');
        
        if (mode === 'restaurant') {
            Message.warning('餐饮模式正在开发中，敬请期待！');
            return;
        }
        
        var allCards = document.querySelectorAll('.mode-card');
        for (var i = 0; i < allCards.length; i++) {
            DOM.removeClass(allCards[i], 'selected');
        }
        DOM.addClass(card, 'selected');
        this.config.businessMode = mode;
    },
    
    completeInit: function() {
        this.config.initialized = true;
        this.config.initTime = new Date().getTime();
        
        this.config.paymentMethods = ['现金'];
        
        AppData.saveConfig(this.config);
        Storage.set('payment_methods', this.config.paymentMethods);
        
        Storage.set('categories', []);
        Storage.set('products', []);
        Storage.set('orders', []);
        Storage.set('today_orders', []);
        
        if (this.config.businessMode === 'restaurant') {
            Storage.set('tables', []);
        }
        
        Message.success('初始化完成！正在跳转...');
        
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 1500);
    }
};

window.InitWizard = InitWizard;
