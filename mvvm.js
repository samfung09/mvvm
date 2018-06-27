function MVVM(options){
    this._options = options;
    this._data = options.data || {};    //配置选项中的data
    var vm = this;
    //数据代理，将data对象中的属性添加到vm实例上
    Object.keys(this._data).forEach(function(key){
        vm._proxy(vm._data, key);
    });
    //如果配置选项中有methods则将methods里的函数添加到vm实例上
    if(typeof options.methods === 'object'){
        Object.keys(options.methods).forEach(function(key){
            vm._proxy(options.methods, key);
        })
    }
    //数据劫持，观察者监视数据变化
    observe(this._data);
    //编译模板，指令与双大括号等
    new Compile(options.el ? options.el : document.body, this);
}

//代理数据
MVVM.prototype._proxy = function(obj, key){
    Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get: function(){
            return obj[key];
        },
        set: function(value){
            obj[key] = value;
        }
    });
}