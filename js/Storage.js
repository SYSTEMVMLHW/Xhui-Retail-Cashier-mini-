// 数据存储管理 - 通过服务器API存储

var Storage = {
    baseURL: 'http://localhost:8888/api',
    requestQueue: [],
    isProcessing: false,
    
    setBaseURL: function(url) {
        this.baseURL = url.replace(/\/$/, '');
    },
    
    _request: function(method, endpoint, data) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = self.baseURL + endpoint;
            
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (e) {
                            resolve({ success: false, error: '解析响应失败' });
                        }
                    } else {
                        resolve({ success: false, error: '请求失败：' + xhr.status });
                    }
                }
            };
            
            xhr.onerror = function() {
                resolve({ success: false, error: '网络错误' });
            };
            
            if (data) {
                xhr.send(JSON.stringify(data));
            } else {
                xhr.send();
            }
        });
    },
    
    set: function(key, value) {
        var xhr = new XMLHttpRequest();
        var url = this.baseURL + '/storage';
        
        xhr.open('POST', url, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        try {
            xhr.send(JSON.stringify({ key: key, value: value }));
            
            if (xhr.status === 0) {
                console.error('Storage set: 无法连接到服务器，请确保服务器已启动');
                return false;
            }
            
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        return true;
                    } else {
                        console.error('Storage set failed:', response.error || '未知错误');
                        return false;
                    }
                } catch (parseError) {
                    console.error('Storage set: 解析响应失败', xhr.responseText);
                    return false;
                }
            } else {
                console.error('Storage set: HTTP错误', xhr.status, xhr.statusText);
                return false;
            }
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get: function(key) {
        var self = this;
        var result = null;
        
        var xhr = new XMLHttpRequest();
        var url = this.baseURL + '/storage?key=' + encodeURIComponent(key);
        
        xhr.open('GET', url, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        try {
            xhr.send();
            if (xhr.status >= 200 && xhr.status < 300) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    result = response.data;
                }
            }
        } catch (e) {
            console.error('Storage get error:', e);
        }
        
        return result;
    },
    
    remove: function(key) {
        var xhr = new XMLHttpRequest();
        var url = this.baseURL + '/storage';
        
        xhr.open('DELETE', url, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        try {
            xhr.send(JSON.stringify({ key: key }));
            if (xhr.status >= 200 && xhr.status < 300) {
                var response = JSON.parse(xhr.responseText);
                return response.success;
            }
        } catch (e) {
            console.error('Storage remove error:', e);
        }
        
        return false;
    },
    
    clear: function() {
        var keys = this.keys();
        
        for (var i = 0; i < keys.length; i++) {
            this.remove(keys[i]);
        }
        
        return true;
    },
    
    has: function(key) {
        return this.get(key) !== null;
    },
    
    keys: function() {
        var result = [];
        var xhr = new XMLHttpRequest();
        var url = this.baseURL + '/list';
        
        xhr.open('GET', url, false);
        
        try {
            xhr.send();
            if (xhr.status >= 200 && xhr.status < 300) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    result = response.data;
                }
            }
        } catch (e) {
            console.error('Storage keys error:', e);
        }
        
        return result;
    },
    
    testConnection: function(callback) {
        var self = this;
        
        this._request('GET', '/storage-dir')
            .then(function(response) {
                if (callback) {
                    callback(response.success);
                }
            });
    }
};

window.Storage = Storage;
