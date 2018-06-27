function Watcher(vm, exp, cb){
    this.$vm = vm;      //vm实例
    this.exp = exp;     //取值表达式
    this.cb = cb;       //回调
    this.value = this.getValue();
}

Watcher.prototype.getValue = function(){
    Dep.target = this;      //作为是订阅者取值的标识
    var value = this.getVMValue(this.exp, this.$vm);
    Dep.target = null;      //添加订阅者之后移除标识
    return value;
}

Watcher.prototype.update = function(){
    var newValue = this.getVMValue(this.exp, this.$vm);
    //如果新旧值不相等则执行回调函数重新渲染
    if(newValue !== this.value){
        this.value = newValue;
        this.cb();
    }
}

//获取vm实例上的数据，对象嵌套取值
Watcher.prototype.getVMValue = function(keyStr, vm){
    return new Function('vm', 'return vm.' + keyStr)(vm);
}