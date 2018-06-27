function Compile(el, vm){
    this.$vm = vm;      //需要vm实例
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);    //根节点
    this.$fragment = this.nodeToFragment(this.$el);     //文档碎片
    this.init(this.$fragment);      //编译模板
    this.$el.appendChild(this.$fragment);       //挂载到dom元素上
}

//创建文档碎片
Compile.prototype.nodeToFragment = function(el){
    var fragment = document.createDocumentFragment();
    while(el.firstChild){
        fragment.appendChild(el.firstChild);
    }
    return fragment;
}

//编译模板
Compile.prototype.init = function(node){
    var nodes = node.childNodes;
    if(nodes.length){       //如果有子节点
        for(var i = 0; i < nodes.length; i++){
            if(this.isElementNode(nodes[i])){       //如果是元素节点
                this.compileElementNode(nodes[i]);      //编译元素节点
                this.init(nodes[i]);        //递归
            }else if(this.isTextNode(nodes[i])){     //如果是文本节点
                this.compileTextNode(nodes[i]);     //编译文本节点
            }
        }
    }
}

//编译文本节点
Compile.prototype.compileTextNode = function(node){
    var text = node.textContent;
    var reg = /\{\{.+\}\}/;     //双大括号{{}}的正则
    if(reg.test(text)){     //如果存在{{}}
        updater.braces(node, text, this.$vm);
        var me = this;      //回调函数内部this指向问题
        text.replace(/\{\{(.+?)\}\}/g, function(){
            var keyStr = arguments[1].trim();       //正则子匹配的值
            new Watcher(me.$vm, keyStr, function(){
                updater.braces(node, text, me.$vm);
            })
            return me.getVMValue(keyStr, me.$vm);
        })
    }
}

//编译元素节点
Compile.prototype.compileElementNode = function(node){
    var attrs = node.attributes;    //标签属性对象集合
    var me = this;
    Array.prototype.slice.call(attrs).forEach(function(attr){
        var attrName = attr.name;
        if(attrName.indexOf('v-') === 0){       //如果元素标签属性函数'v-'即为指令
            var attrValue = node.getAttribute(attrName);
            if(attrName.indexOf('on') > 0){     //指令属性键名含有'on'即为事件指令
                me.eventDirective(node, attrName, attrValue, me.$vm);       //事件指令                
            }else{      //否则为一般指令
                var directive = attrName.slice(2);      //指令名                
                if(directiveUtil[directive]){       //如果存在该指令才执行
                    directiveUtil[directive](node, me.$vm, attrName, attrValue);
                }
            }
        }
    })
}

//是否元素节点
Compile.prototype.isElementNode = function(node){
    return node.nodeType === 1;
}
//是否文本节点
Compile.prototype.isTextNode = function(node){
    return node.nodeType === 3;
}

//获取vm实例上的数据，对象嵌套取值
Compile.prototype.getVMValue = function(keyStr, vm){
    return new Function('vm', 'return vm.' + keyStr)(vm);
}

//事件指令
Compile.prototype.eventDirective = function(node, attrName, attrValue, vm){
    var eventName = attrName.split(':')[1];
    var fn = this.getVMValue(attrValue, vm);
    if(fn){
        node.addEventListener(eventName, fn.bind(vm), false);   //元素监听事件，回调函数内部指向vm实例
        node.removeAttribute(attrName);
    }
}

//指令工具
var directiveUtil = {
    //v-text
    text: function(node, vm, attrName, attrValue){
        this.bind(node, vm, attrName, attrValue, 'text');
    },
    //v-html
    html: function(node, vm, attrName, attrValue){
        this.bind(node, vm, attrName, attrValue, 'html');       
    },
    //v-class
    class: function(node, vm, attrName, attrValue){
        this.bind(node, vm, attrName, attrValue, 'class');
    },
    //v-model
    model: function(node, vm, attrName, attrValue){
        this.bind(node, vm, attrName, attrValue, 'model');
        node.addEventListener('input', function(){
            var value = node.value;
            // 用new Function()来执行表达式字符串
            new Function('vm', 'value', 'console.log(vm.'+attrValue+'= value)')(vm, value);            
        }, false);
    },
    //用于给指令添加订阅者
    bind: function(node, vm, attrName, attrValue, funName){
        //初始化界面
        updater[funName] && updater[funName](node, vm, attrValue);  //如果存在则执行
        var exp = attrValue;
        if(attrValue.indexOf('?') > 0 && attrValue.indexOf(':') > 0){   //如果标签属性值是三元表达式
            exp = attrValue.slice(0, attrValue.indexOf('?')).trim();    //表达式？前的变量
        }
        //添加订阅者
        new Watcher(vm, exp, function(){
            updater[funName] && updater[funName](node, vm, attrValue);  //如果监视的值变了才执行
        });
        //移除html指令属性
        node.removeAttribute(attrName);
    }
}

//更新工具，数据变化时会调用的函数
var updater = {
    //双大括号
    braces: function(node, text, vm){
        node.textContent = text.replace(/\{\{(.+?)\}\}/g, function(){
            var keyStr = arguments[1].trim();       //正则子匹配的值
            return Compile.prototype.getVMValue(keyStr, vm);
        });
    },
    //v-text
    text: function(node, vm, attrValue){
        var value = Compile.prototype.getVMValue(attrValue, vm);
        node.textContent = value;
    },
    //v-html
    html: function(node, vm, attrValue){
        var value = Compile.prototype.getVMValue(attrValue, vm);
        node.innerHTML = value;
    },
    //v-class
    class: function(node, vm, attrValue){
        var newClass = '';
        if(attrValue.indexOf('?') > 0 && attrValue.indexOf(':') > 0){   //如果是三元表达式
            var variable = attrValue.slice(0, attrValue.indexOf('?')).trim();//表达式？前的变量
            var val = Compile.prototype.getVMValue(variable, vm);       //表达式？前的变量的值
            var expression = attrValue.replace(/.+\?/, val+' ?');       //新的三元表达式
            newClass = new Function("return "+ expression)();       //得到新的类名
            expression = attrValue.replace(/.+\?/, !val+' ?');       //旧的三元表达式
            oldClass = new Function("return "+ expression)();       //得到旧的类名
        }else{
            newClass = Compile.prototype.getVMValue(attrValue, vm);     //否则类名在vm实例中找
        }
        var classNameStr = node.className;
        if(classNameStr){         //如果元素原来有类名
            var classNames = node.className.split(' ');
            if(classNames.indexOf(oldClass) >= 0){      //如果旧类名存在
                classNames.splice(classNames.indexOf(oldClass), 1);     //去除旧类名
                classNameStr = classNames.join(' ');
            }
            node.className = classNameStr + ' ' + newClass;
        }else{
            node.className = newClass;
        }
    },
    //v-model
    model: function(node, vm, attrValue){
        node.value = Compile.prototype.getVMValue(attrValue, vm);  
    }
}