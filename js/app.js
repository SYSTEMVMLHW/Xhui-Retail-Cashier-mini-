var App = {
    currentUser: null,
    config: null,
    
    init: function() {
        this.checkInitialization();
        this.bindEvents();
    },
    
    checkInitialization: function() {
        this.config = AppData.getConfig();
        
        if (!this.config.initialized) {
            Router.navigate('init-wizard');
            InitWizard.init();
        } else {
            Router.navigate('login');
        }
    },
    
    bindEvents: function() {
        var self = this;
        
        DOM.addEventListener(document, 'submit', function(e) {
            if (e.target && e.target.id === 'login-form') {
                e.preventDefault();
                self.handleLogin();
            }
        });
        
        DOM.addEventListener(document, 'click', function(e) {
            if (e.target && e.target.id === 'btn-logout') {
                self.handleLogout();
            }
        });
        
        DOM.addEventListener(document, 'click', function(e) {
            if (e.target && e.target.closest('[data-view]')) {
                var viewName = e.target.closest('[data-view]').getAttribute('data-view');
                if (viewName) {
                    self.switchView(viewName);
                }
            }
        });
        
        document.addEventListener('viewChange', function(e) {
            self.onViewChange(e.viewName, e.params);
        });
    },
    
    handleLogin: function() {
        var username = DOM.getElement('#login-username').value.trim();
        var password = DOM.getElement('#login-password').value;
        
        if (!username) {
            Message.error('请输入用户名');
            return;
        }
        
        if (!password) {
            Message.error('请输入密码');
            return;
        }
        
        var hashedPassword = Utils.md5(password);
        var config = AppData.getConfig();
        
        if (username === config.username && hashedPassword === config.password) {
            this.currentUser = {
                username: username,
                loginTime: new Date().getTime()
            };
            
            Message.success('登录成功');
            
            setTimeout(function() {
                App.showMainView();
            }, 500);
        } else {
            Message.error('用户名或密码错误');
        }
    },
    
    handleLogout: function() {
        var self = this;
        
        Message.confirm('退出登录', '确定要退出登录吗？', function() {
            self.currentUser = null;
            Router.navigate('login');
            DOM.getElement('#login-password').value = '';
        });
    },
    
    showMainView: function() {
        var config = AppData.getConfig();
        var viewName = config.businessMode === 'retail' ? 'retail' : 'restaurant';
        this.switchView(viewName);
    },
    
    switchView: function(viewName) {
        Router.navigate(viewName);
        
        var navItems = document.querySelectorAll('[data-view]');
        for (var i = 0; i < navItems.length; i++) {
            if (navItems[i].getAttribute('data-view') === viewName) {
                DOM.addClass(navItems[i], 'active');
            } else {
                DOM.removeClass(navItems[i], 'active');
            }
        }
    },
    
    onViewChange: function(viewName, params) {
        switch(viewName) {
            case 'retail':
                if (typeof RetailManager !== 'undefined' && RetailManager.init) {
                    RetailManager.init();
                }
                break;
            case 'restaurant':
                if (typeof RestaurantManager !== 'undefined' && RestaurantManager.init) {
                    RestaurantManager.init();
                }
                break;
            case 'products':
                if (typeof ProductsManager !== 'undefined' && ProductsManager.init) {
                    ProductsManager.init();
                }
                break;
            case 'reports':
                if (typeof ReportsManager !== 'undefined' && ReportsManager.init) {
                    ReportsManager.init();
                }
                break;
        }
    }
};

window.App = App;

function initApp() {
    setTimeout(function() {
        var loading = DOM.getElement('#loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(function() {
                DOM.hide(loading);
            }, 300);
        }
    }, 500);
    
    Router.init();
    
    App.init();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initApp, 100);
} else {
    DOM.addEventListener(document, 'DOMContentLoaded', function() {
        initApp();
    });
}

